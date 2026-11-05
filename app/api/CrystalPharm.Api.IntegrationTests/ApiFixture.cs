using System.Text;
using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using CrystalPharm.Api.Authentication;
using CrystalPharm.Api.Database;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using DotNet.Testcontainers.Builders;
using DotNet.Testcontainers.Containers;
using Npgsql;
using Testcontainers.PostgreSql;

namespace CrystalPharm.Api.IntegrationTests;

/// <summary>
/// L'API sur un vrai Postgres, connectée comme en production par un rôle ordinaire,
/// soumis à la Row-Level Security (le superutilisateur du conteneur ne sert qu'à migrer, comme le propriétaire en prod),
/// et sur un vrai stockage objet S3 (SeaweedFS, comme en dev), avec une clé limitée à son bucket.
/// </summary>
public sealed class ApiFixture : WebApplicationFactory<Program>, IAsyncLifetime
{
    private const string ApplicationRoleName = "crystal_pharm_api";
    private const string ApplicationRolePassword = "crystal-pharm-api-test";

    private readonly PostgreSqlContainer _database = new PostgreSqlBuilder().WithImage("postgres:16").Build();

    public const string SiteServiceKey = "test-site-service-key-0123456789abcdef";

    public const string PrescriptionBucketName = "prescriptions";
    private const int ObjectStoragePort = 8333;
    private const string StorageAdminAccessKey = "test-storage-admin";
    private const string StorageAdminSecretKey = "test-storage-admin-secret-0123456789";
    private const string StorageApiAccessKey = "test-storage-api";
    private const string StorageApiSecretKey = "test-storage-api-secret-0123456789ab";

    // Le même découpage des clés qu'en dev (cf. docker/object-storage) : le C# ne peut pas créer de bucket.
    private static readonly string ObjectStorageIdentities = $$"""
        {"identities": [
          {"name": "admin", "credentials": [{"accessKey": "{{StorageAdminAccessKey}}", "secretKey": "{{StorageAdminSecretKey}}"}], "actions": ["Admin"]},
          {"name": "api", "credentials": [{"accessKey": "{{StorageApiAccessKey}}", "secretKey": "{{StorageApiSecretKey}}"}],
           "actions": ["Read:{{PrescriptionBucketName}}", "Write:{{PrescriptionBucketName}}", "List:{{PrescriptionBucketName}}"]}
        ]}
        """;

    private readonly IContainer _objectStorage = new ContainerBuilder()
        .WithImage("chrislusf/seaweedfs:4.47")
        .WithResourceMapping(Encoding.UTF8.GetBytes(ObjectStorageIdentities), "/etc/seaweedfs/s3.json")
        .WithCommand("server", "-dir=/data", "-s3", "-s3.config=/etc/seaweedfs/s3.json", $"-s3.port={ObjectStoragePort}", "-volume.max=0", "-master.volumeSizeLimitMB=64")
        .WithPortBinding(ObjectStoragePort, assignRandomHostPort: true)
        .WithWaitStrategy(Wait.ForUnixContainer().UntilInternalTcpPortIsAvailable(ObjectStoragePort))
        .Build();

    public ManagerTokens ManagerTokens { get; } = new();

    public string ObjectStorageUrl => $"http://{_objectStorage.Hostname}:{_objectStorage.GetMappedPublicPort(ObjectStoragePort)}";

    public string SuperuserConnectionString => _database.GetConnectionString();

    public async Task InitializeAsync()
    {
        await Task.WhenAll(_database.StartAsync(), _objectStorage.StartAsync());
        await CreatePrescriptionBucketAsync();
        await CreateApplicationRoleAsync();
        await MigrateAsOwnerAsync();

        Environment.SetEnvironmentVariable("ConnectionStrings__Booking", BuildApplicationRoleConnectionString());
        Environment.SetEnvironmentVariable("ConnectionStrings__Prescriptions", BuildApplicationRoleConnectionString());
        foreach (var (name, value) in PrescriptionStorageSettings())
        {
            Environment.SetEnvironmentVariable($"PrescriptionStorage__{name}", value);
        }

        Environment.SetEnvironmentVariable("SiteService__ApiKey", SiteServiceKey);
        Environment.SetEnvironmentVariable("ManagerJwt__JwksUrl", "http://jwks.test/api/auth/jwks");
        Environment.SetEnvironmentVariable("ManagerJwt__Issuer", ManagerTokens.Issuer);
        Environment.SetEnvironmentVariable("ManagerJwt__Audience", ManagerTokens.Audience);
    }

    public new async Task DisposeAsync()
    {
        await base.DisposeAsync();
        await _database.DisposeAsync();
        await _objectStorage.DisposeAsync();
    }

    /// <summary>Les clés des fichiers gardés sous ce préfixe, lues avec la clé d'administration du stockage.</summary>
    public async Task<IReadOnlyList<string>> ListStoredKeysAsync(string prefix)
    {
        using var storage = CreateStorageClient(StorageAdminAccessKey, StorageAdminSecretKey);
        var response = await storage.ListObjectsV2Async(new ListObjectsV2Request { BucketName = PrescriptionBucketName, Prefix = prefix });
        return (response.S3Objects ?? []).Select(stored => stored.Key).ToArray();
    }

    public async Task<byte[]> ReadStoredObjectAsync(string key)
    {
        using var storage = CreateStorageClient(StorageAdminAccessKey, StorageAdminSecretKey);
        using var response = await storage.GetObjectAsync(PrescriptionBucketName, key);
        using var content = new MemoryStream();
        await response.ResponseStream.CopyToAsync(content);
        return content.ToArray();
    }

    private IEnumerable<(string Name, string Value)> PrescriptionStorageSettings() =>
    [
        ("ServiceUrl", ObjectStorageUrl),
        ("PublicServiceUrl", ObjectStorageUrl),
        ("BucketName", PrescriptionBucketName),
        ("AccessKeyId", StorageApiAccessKey),
        ("SecretAccessKey", StorageApiSecretKey),
    ];

    // SeaweedFS ouvre son port avant que son S3 réponde : on réessaie la création quelques secondes.
    private async Task CreatePrescriptionBucketAsync()
    {
        using var storage = CreateStorageClient(StorageAdminAccessKey, StorageAdminSecretKey);
        for (var attempt = 1; ; attempt++)
        {
            try
            {
                await storage.PutBucketAsync(PrescriptionBucketName);
                return;
            }
            catch (Exception) when (attempt < 30)
            {
                await Task.Delay(TimeSpan.FromMilliseconds(500));
            }
        }
    }

    private AmazonS3Client CreateStorageClient(string accessKey, string secretKey) =>
        new(new BasicAWSCredentials(accessKey, secretKey), new AmazonS3Config
        {
            ServiceURL = ObjectStorageUrl,
            AuthenticationRegion = "us-east-1",
            ForcePathStyle = true,
            RequestChecksumCalculation = RequestChecksumCalculation.WHEN_REQUIRED,
            ResponseChecksumValidation = ResponseChecksumValidation.WHEN_REQUIRED,
        });

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureTestServices(services =>
            services.PostConfigure<JwtBearerOptions>(ManagerAuthentication.SchemeName, options =>
            {
                var configuration = new OpenIdConnectConfiguration();
                configuration.SigningKeys.Add(ManagerTokens.SigningKey);
                options.ConfigurationManager = new StaticConfigurationManager<OpenIdConnectConfiguration>(configuration);
            }));
    }

    // Comme au déploiement : le rôle de l'API existe avant les tables, que le propriétaire crée en migrant.
    private async Task MigrateAsOwnerAsync()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:HealthMigrations"] = SuperuserConnectionString,
            })
            .AddInMemoryCollection(PrescriptionStorageSettings().Select(setting =>
                new KeyValuePair<string, string?>($"PrescriptionStorage:{setting.Name}", setting.Value)))
            .Build();
        await using var unusedApplicationServices = new ServiceCollection().BuildServiceProvider();
        await HealthDatabaseMigrations.ApplyAsync(unusedApplicationServices, configuration, CancellationToken.None);
    }

    // Le même SQL que docker/health-postgres/create-api-role.sh.
    private async Task CreateApplicationRoleAsync()
    {
        await using var connection = new NpgsqlConnection(SuperuserConnectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(
            $"""
            create role {ApplicationRoleName} login password '{ApplicationRolePassword}' nosuperuser nobypassrls;
            create schema if not exists booking;
            create schema if not exists prescriptions;
            grant usage on schema booking, prescriptions to {ApplicationRoleName};
            alter default privileges in schema booking, prescriptions
                grant select, insert, update, delete on tables to {ApplicationRoleName};
            alter default privileges in schema booking, prescriptions
                grant usage, select on sequences to {ApplicationRoleName};
            """,
            connection);
        await command.ExecuteNonQueryAsync();
    }

    public string ApplicationRoleConnectionString => BuildApplicationRoleConnectionString();

    private string BuildApplicationRoleConnectionString() =>
        new NpgsqlConnectionStringBuilder(SuperuserConnectionString)
        {
            Username = ApplicationRoleName,
            Password = ApplicationRolePassword,
        }.ConnectionString;
}

[CollectionDefinition(Name)]
public sealed class ApiCollection : ICollectionFixture<ApiFixture>
{
    public const string Name = "API";
}

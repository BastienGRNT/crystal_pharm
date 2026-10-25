using CrystalPharm.Api.Authentication;
using CrystalPharm.Api.Tenancy;
using CrystalPharm.Booking.Infrastructure;
using CrystalPharm.Prescriptions.Infrastructure;
using CrystalPharm.SharedKernel.Tenancy;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Npgsql;
using Testcontainers.PostgreSql;

namespace CrystalPharm.Api.IntegrationTests;

/// <summary>
/// L'API sur un vrai Postgres, connectée comme en production par un rôle ordinaire,
/// soumis à la Row-Level Security (le superutilisateur du conteneur ne sert qu'à migrer).
/// </summary>
public sealed class ApiFixture : WebApplicationFactory<Program>, IAsyncLifetime
{
    private const string ApplicationRoleName = "crystal_pharm_api";
    private const string ApplicationRolePassword = "crystal-pharm-api-test";

    private readonly PostgreSqlContainer _database = new PostgreSqlBuilder().WithImage("postgres:16").Build();

    public const string SiteServiceKey = "test-site-service-key-0123456789abcdef";

    private readonly string _prescriptionStorageDirectory = Path.Combine(Path.GetTempPath(), $"crystal-pharm-tests-{Guid.NewGuid():N}");

    public ManagerTokens ManagerTokens { get; } = new();

    public string PrescriptionStorageDirectory => _prescriptionStorageDirectory;

    public string SuperuserConnectionString => _database.GetConnectionString();

    public async Task InitializeAsync()
    {
        await _database.StartAsync();
        await MigrateAsSuperuserAsync();
        await CreateApplicationRoleAsync();

        Environment.SetEnvironmentVariable("ConnectionStrings__Booking", BuildApplicationRoleConnectionString());
        Environment.SetEnvironmentVariable("ConnectionStrings__Prescriptions", BuildApplicationRoleConnectionString());
        Environment.SetEnvironmentVariable("PrescriptionStorage__LocalDirectory", _prescriptionStorageDirectory);
        Environment.SetEnvironmentVariable("SiteService__ApiKey", SiteServiceKey);
        Environment.SetEnvironmentVariable("ManagerJwt__JwksUrl", "http://jwks.test/api/auth/jwks");
        Environment.SetEnvironmentVariable("ManagerJwt__Issuer", ManagerTokens.Issuer);
        Environment.SetEnvironmentVariable("ManagerJwt__Audience", ManagerTokens.Audience);
    }

    public new async Task DisposeAsync()
    {
        await base.DisposeAsync();
        await _database.DisposeAsync();
        if (Directory.Exists(_prescriptionStorageDirectory))
        {
            Directory.Delete(_prescriptionStorageDirectory, recursive: true);
        }
    }

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

    private async Task MigrateAsSuperuserAsync()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["ConnectionStrings:Booking"] = SuperuserConnectionString,
                ["ConnectionStrings:Prescriptions"] = SuperuserConnectionString,
                ["PrescriptionStorage:LocalDirectory"] = _prescriptionStorageDirectory,
            })
            .Build();
        var services = new ServiceCollection()
            .AddSingleton(TimeProvider.System)
            .AddScoped<ITenantContext, RequestTenantContext>()
            .AddBookingModule(configuration)
            .AddPrescriptionsModule(configuration);
        await using var serviceProvider = services.BuildServiceProvider();
        await serviceProvider.ApplyBookingMigrationsAsync(CancellationToken.None);
        await serviceProvider.ApplyPrescriptionsMigrationsAsync(CancellationToken.None);
    }

    private async Task CreateApplicationRoleAsync()
    {
        await using var connection = new NpgsqlConnection(SuperuserConnectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(
            $"""
            create role {ApplicationRoleName} login password '{ApplicationRolePassword}';
            grant usage on schema booking, prescriptions to {ApplicationRoleName};
            grant select, insert, update, delete on all tables in schema booking, prescriptions to {ApplicationRoleName};
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

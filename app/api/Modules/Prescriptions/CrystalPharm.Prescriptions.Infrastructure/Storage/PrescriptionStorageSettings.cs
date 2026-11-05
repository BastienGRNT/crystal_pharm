using Amazon.Runtime;
using Amazon.S3;
using Microsoft.Extensions.Configuration;

namespace CrystalPharm.Prescriptions.Infrastructure.Storage;

/// <summary>
/// Le stockage objet des fichiers de santé, lu dans l'environnement (<c>PrescriptionStorage__*</c>) : son adresse
/// interne, celle que voit le navigateur, son bucket et sa clé d'accès, propre au C#.
/// </summary>
internal sealed record PrescriptionStorageSettings(
    Uri ServiceUrl,
    Uri PublicServiceUrl,
    string Region,
    string BucketName,
    string AccessKeyId,
    string SecretAccessKey)
{
    private const string Section = "PrescriptionStorage";

    public static PrescriptionStorageSettings ReadFrom(IConfiguration configuration)
    {
        var serviceUrl = new Uri(Required(configuration, "ServiceUrl"));
        var publicServiceUrl = configuration[$"{Section}:PublicServiceUrl"] is { Length: > 0 } publicUrl ? new Uri(publicUrl) : serviceUrl;
        return new PrescriptionStorageSettings(
            serviceUrl,
            publicServiceUrl,
            configuration[$"{Section}:Region"] is { Length: > 0 } region ? region : "us-east-1",
            Required(configuration, "BucketName"),
            Required(configuration, "AccessKeyId"),
            Required(configuration, "SecretAccessKey"));
    }

    public IAmazonS3 CreateClient(Uri serviceUrl) =>
        new AmazonS3Client(
            new BasicAWSCredentials(AccessKeyId, SecretAccessKey),
            new AmazonS3Config
            {
                ServiceURL = serviceUrl.ToString(),
                AuthenticationRegion = Region,
                ForcePathStyle = true,
                // Les stockages compatibles S3 ne gèrent pas tous les sommes de contrôle ajoutées par défaut.
                RequestChecksumCalculation = Amazon.Runtime.RequestChecksumCalculation.WHEN_REQUIRED,
                ResponseChecksumValidation = Amazon.Runtime.ResponseChecksumValidation.WHEN_REQUIRED,
            });

    private static string Required(IConfiguration configuration, string name) =>
        configuration[$"{Section}:{name}"] is { Length: > 0 } value
            ? value
            : throw new InvalidOperationException($"{Section}__{name} is missing from the environment.");
}

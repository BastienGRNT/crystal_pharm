using Amazon.S3;
using Amazon.S3.Model;
using CrystalPharm.Prescriptions.Application.Interfaces;

namespace CrystalPharm.Prescriptions.Infrastructure.Storage;

/// <summary>
/// Les fichiers dans un stockage objet compatible S3 : le stockage HDS en prod, SeaweedFS en dev.
/// Deux clients : l'un parle au stockage par le réseau interne, l'autre ne fait que signer des liens
/// pour l'adresse publique, celle que le navigateur atteint. Une clé est faite d'identifiants séparés par « / ».
/// </summary>
internal sealed class S3PrescriptionDocumentStore(
    IAmazonS3 internalClient,
    IAmazonS3 publicLinkSigner,
    string bucketName) : IPrescriptionDocumentStore
{
    public async Task SaveAsync(string storageKey, Stream content, CancellationToken cancellationToken)
    {
        await internalClient.PutObjectAsync(
            new PutObjectRequest
            {
                BucketName = bucketName,
                Key = ValidatedKey(storageKey),
                InputStream = content,
                AutoCloseStream = false,
            },
            cancellationToken);
    }

    public async Task<Stream?> OpenReadAsync(string storageKey, CancellationToken cancellationToken)
    {
        try
        {
            var response = await internalClient.GetObjectAsync(bucketName, ValidatedKey(storageKey), cancellationToken);
            return response.ResponseStream;
        }
        catch (AmazonS3Exception exception) when (IsMissingObject(exception))
        {
            return null;
        }
    }

    public async Task<byte[]?> ReadBeginningAsync(string storageKey, int length, CancellationToken cancellationToken)
    {
        try
        {
            using var response = await internalClient.GetObjectAsync(
                new GetObjectRequest { BucketName = bucketName, Key = ValidatedKey(storageKey), ByteRange = new ByteRange(0, length - 1) },
                cancellationToken);
            var beginning = new byte[length];
            var readLength = await response.ResponseStream.ReadAtLeastAsync(beginning, length, throwOnEndOfStream: false, cancellationToken);
            return beginning[..readLength];
        }
        catch (AmazonS3Exception exception) when (IsMissingObject(exception))
        {
            return null;
        }
    }

    public async Task<long?> FindSizeAsync(string storageKey, CancellationToken cancellationToken)
    {
        try
        {
            var metadata = await internalClient.GetObjectMetadataAsync(bucketName, ValidatedKey(storageKey), cancellationToken);
            return metadata.ContentLength;
        }
        catch (AmazonS3Exception exception) when (IsMissingObject(exception))
        {
            return null;
        }
    }

    public async Task DeleteAsync(string storageKey, CancellationToken cancellationToken)
    {
        await internalClient.DeleteObjectAsync(bucketName, ValidatedKey(storageKey), cancellationToken);
    }

    public async Task<DocumentUploadLink> CreateUploadLinkAsync(string storageKey, string mimeType, long sizeInBytes, DateTimeOffset expiresAt)
    {
        var request = new GetPreSignedUrlRequest
        {
            BucketName = bucketName,
            Key = ValidatedKey(storageKey),
            Verb = HttpVerb.PUT,
            Expires = expiresAt.UtcDateTime,
            ContentType = mimeType,
            Protocol = ProtocolOf(publicLinkSigner),
        };
        var url = await publicLinkSigner.GetPreSignedURLAsync(request);
        return new DocumentUploadLink(new Uri(url), new Dictionary<string, string> { ["content-type"] = mimeType });
    }

    public async Task<Uri> CreateDownloadLinkAsync(string storageKey, string mimeType, DateTimeOffset expiresAt)
    {
        var request = new GetPreSignedUrlRequest
        {
            BucketName = bucketName,
            Key = ValidatedKey(storageKey),
            Verb = HttpVerb.GET,
            Expires = expiresAt.UtcDateTime,
            Protocol = ProtocolOf(publicLinkSigner),
        };
        // Le type vient du format reconnu au contenu, jamais de ce que le navigateur avait annoncé.
        request.ResponseHeaderOverrides.ContentType = mimeType;
        request.ResponseHeaderOverrides.ContentDisposition = "inline";
        request.ResponseHeaderOverrides.CacheControl = "private, no-store";
        return new Uri(await publicLinkSigner.GetPreSignedURLAsync(request));
    }

    private static Protocol ProtocolOf(IAmazonS3 client) =>
        client.Config.ServiceURL?.StartsWith("http://", StringComparison.OrdinalIgnoreCase) == true ? Protocol.HTTP : Protocol.HTTPS;

    private static bool IsMissingObject(AmazonS3Exception exception) =>
        exception.StatusCode == System.Net.HttpStatusCode.NotFound;

    private static string ValidatedKey(string storageKey)
    {
        var segments = storageKey.Split('/');
        if (segments.Any(segment => segment.Length == 0 || !segment.All(char.IsAsciiLetterOrDigit)))
        {
            throw new ArgumentException("The storage key is not made of plain identifiers.", nameof(storageKey));
        }

        return storageKey;
    }
}

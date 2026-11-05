namespace CrystalPharm.Prescriptions.Application.Interfaces;

/// <summary>
/// Où sont gardés les fichiers des envois : un stockage objet compatible S3, chez l'hébergeur HDS en prod.
/// Une clé désigne un fichier ; l'implémentation ne doit jamais en déduire un chemin hors de sa racine.
/// Le navigateur n'y accède que par un lien pré-signé, court et limité à un fichier.
/// </summary>
public interface IPrescriptionDocumentStore
{
    Task SaveAsync(string storageKey, Stream content, CancellationToken cancellationToken);

    /// <summary>Le fichier en flux, que l'appelant ferme ; <c>null</c> quand il n'existe pas.</summary>
    Task<Stream?> OpenReadAsync(string storageKey, CancellationToken cancellationToken);

    /// <summary>Les premiers octets du fichier (moins s'il est plus court) ; <c>null</c> quand il n'existe pas.</summary>
    Task<byte[]?> ReadBeginningAsync(string storageKey, int length, CancellationToken cancellationToken);

    /// <summary>La taille du fichier déposé ; <c>null</c> quand il n'existe pas.</summary>
    Task<long?> FindSizeAsync(string storageKey, CancellationToken cancellationToken);

    /// <summary>Sans effet quand le fichier n'existe pas.</summary>
    Task DeleteAsync(string storageKey, CancellationToken cancellationToken);

    /// <summary>Un lien pour que le navigateur dépose ce fichier lui-même, avec ce type et cette taille seulement.</summary>
    Task<DocumentUploadLink> CreateUploadLinkAsync(string storageKey, string mimeType, long sizeInBytes, DateTimeOffset expiresAt);

    /// <summary>Un lien pour afficher ce fichier dans le navigateur, avec ce type, jamais gardé en cache.</summary>
    Task<Uri> CreateDownloadLinkAsync(string storageKey, string mimeType, DateTimeOffset expiresAt);
}

/// <param name="Url">Le lien pré-signé, à appeler en <c>PUT</c>.</param>
/// <param name="RequiredHeaders">Les en-têtes signés avec le lien : le dépôt échoue sans eux.</param>
public sealed record DocumentUploadLink(Uri Url, IReadOnlyDictionary<string, string> RequiredHeaders);

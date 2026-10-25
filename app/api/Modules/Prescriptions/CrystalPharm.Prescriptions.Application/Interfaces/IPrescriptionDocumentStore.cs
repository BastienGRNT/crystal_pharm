namespace CrystalPharm.Prescriptions.Application.Interfaces;

/// <summary>
/// Où sont gardés les fichiers des envois : un dossier local en dev, l'hébergeur HDS en prod.
/// Une clé désigne un fichier ; l'implémentation ne doit jamais en déduire un chemin hors de sa racine.
/// </summary>
public interface IPrescriptionDocumentStore
{
    Task SaveAsync(string storageKey, Stream content, CancellationToken cancellationToken);

    /// <summary>Le fichier en flux, que l'appelant ferme ; <c>null</c> quand il n'existe pas.</summary>
    Task<Stream?> OpenReadAsync(string storageKey, CancellationToken cancellationToken);

    /// <summary>Sans effet quand le fichier n'existe pas.</summary>
    Task DeleteAsync(string storageKey, CancellationToken cancellationToken);
}

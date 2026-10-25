using CrystalPharm.Prescriptions.Application.Interfaces;

namespace CrystalPharm.Prescriptions.Infrastructure.Storage;

/// <summary>
/// Les fichiers dans un dossier local, pour le dev : jamais suivi par git, jamais en prod.
/// Chaque clé est composée d'identifiants (lettres et chiffres) séparés par « / » : tout le reste est refusé,
/// pour qu'aucune clé ne puisse sortir du dossier racine.
/// </summary>
internal sealed class LocalDiskPrescriptionDocumentStore : IPrescriptionDocumentStore
{
    private readonly string rootDirectory;

    public LocalDiskPrescriptionDocumentStore(string rootDirectory)
    {
        this.rootDirectory = Path.GetFullPath(rootDirectory);
    }

    public async Task SaveAsync(string storageKey, Stream content, CancellationToken cancellationToken)
    {
        var path = ResolvePath(storageKey);
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);

        // Écrit à côté puis renomme : un fichier lisible est toujours complet.
        var temporaryPath = $"{path}.partial";
        try
        {
            await using (var file = new FileStream(temporaryPath, FileMode.CreateNew, FileAccess.Write, FileShare.None))
            {
                await content.CopyToAsync(file, cancellationToken);
            }

            File.Move(temporaryPath, path, overwrite: false);
        }
        catch
        {
            File.Delete(temporaryPath);
            throw;
        }
    }

    public Task<Stream?> OpenReadAsync(string storageKey, CancellationToken cancellationToken)
    {
        var path = ResolvePath(storageKey);
        Stream? content = File.Exists(path) ? new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read) : null;
        return Task.FromResult(content);
    }

    public Task DeleteAsync(string storageKey, CancellationToken cancellationToken)
    {
        File.Delete(ResolvePath(storageKey));
        return Task.CompletedTask;
    }

    private string ResolvePath(string storageKey)
    {
        var segments = storageKey.Split('/');
        if (segments.Length == 0 || segments.Any(segment => segment.Length == 0 || !segment.All(char.IsAsciiLetterOrDigit)))
        {
            throw new ArgumentException("The storage key is not made of plain identifiers.", nameof(storageKey));
        }

        return Path.Combine([rootDirectory, .. segments]);
    }
}

using CrystalPharm.Prescriptions.Domain.ValueObjects;
using CrystalPharm.SharedKernel.Tenancy;

namespace CrystalPharm.Prescriptions.Domain.Entities;

/// <summary>Un fichier d'un envoi : sa nature, son format et sa clé dans le stockage. Donnée de santé.</summary>
public sealed class SubmittedDocument : ITenantOwned
{
    public const long MaximumSizeInBytes = 10 * 1024 * 1024;

    public Guid Id { get; private set; }
    public Guid TenantId { get; private set; }
    public Guid SubmissionId { get; private set; }
    public DocumentKind Kind { get; private set; }
    public DocumentFormat Format { get; private set; }
    public long SizeInBytes { get; private set; }

    /// <summary>Sa place dans ce que le patient a envoyé : la première page de l'ordonnance vaut 0.</summary>
    public int Position { get; private set; }

    /// <summary>
    /// Où le stockage garde ce fichier : une clé opaque faite d'identifiants, jamais d'un nom reçu.
    /// </summary>
    public string StorageKey => $"{SubmissionId:N}/{Id:N}";

    // Pour EF Core, qui remplit les propriétés à la lecture.
    private SubmittedDocument()
    {
    }

    internal SubmittedDocument(Guid submissionId, int position, DocumentDraft draft)
    {
        if (draft.SizeInBytes is <= 0 or > MaximumSizeInBytes)
        {
            throw new InvalidPrescriptionException("Chaque fichier doit être non vide et ne pas dépasser 10 Mo.");
        }

        Id = Guid.NewGuid();
        SubmissionId = submissionId;
        Position = position;
        Kind = draft.Kind;
        Format = draft.Format;
        SizeInBytes = draft.SizeInBytes;
    }

    /// <summary>Ce qui a été déposé est bien ce que le navigateur avait annoncé : même format reconnu, même taille.</summary>
    public bool IsAnnouncedAs(DocumentFormat detectedFormat, long storedSizeInBytes) =>
        Format == detectedFormat && SizeInBytes == storedSizeInBytes;
}

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

    /// <summary>
    /// Où le stockage garde ce fichier : une clé opaque faite d'identifiants, jamais d'un nom reçu.
    /// </summary>
    public string StorageKey => $"{SubmissionId:N}/{Id:N}";

    // Pour EF Core, qui remplit les propriétés à la lecture.
    private SubmittedDocument()
    {
    }

    internal SubmittedDocument(Guid submissionId, DocumentDraft draft)
    {
        if (draft.SizeInBytes is <= 0 or > MaximumSizeInBytes)
        {
            throw new InvalidPrescriptionException("Chaque fichier doit être non vide et ne pas dépasser 10 Mo.");
        }

        Id = Guid.NewGuid();
        SubmissionId = submissionId;
        Kind = draft.Kind;
        Format = draft.Format;
        SizeInBytes = draft.SizeInBytes;
    }
}

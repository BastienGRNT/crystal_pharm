using CrystalPharm.Prescriptions.Domain.ValueObjects;
using CrystalPharm.SharedKernel.Tenancy;

namespace CrystalPharm.Prescriptions.Domain.Entities;

/// <summary>
/// Ce qu'un Visitor envoie depuis le site d'une pharmacie : son ordonnance et, s'il veut gagner du temps
/// au comptoir, sa carte Vitale et sa mutuelle. Donnée de santé.
/// </summary>
public sealed class PrescriptionSubmission : ITenantOwned
{
    public const int MaximumIdempotencyKeyLength = 100;

    private readonly List<SubmittedDocument> documents = [];

    public Guid Id { get; private set; }
    public Guid TenantId { get; private set; }

    /// <summary>Choisie par `site` pour un envoi : la rejouer ne crée jamais un second envoi.</summary>
    public string IdempotencyKey { get; private set; }

    public string FirstName { get; private set; }
    public string LastName { get; private set; }
    public DateOnly BirthDate { get; private set; }
    public string Phone { get; private set; }

    /// <summary>Date et heure locales de la pharmacie, sans fuseau.</summary>
    public DateTime PlannedVisitAt { get; private set; }

    public bool HasAlreadyVisited { get; private set; }
    public string? SocialSecurityNumber { get; private set; }
    public DateTimeOffset SubmittedAt { get; private set; }
    public IReadOnlyCollection<SubmittedDocument> Documents => documents;

    // Pour EF Core, qui remplit les propriétés à la lecture.
    private PrescriptionSubmission()
    {
        IdempotencyKey = string.Empty;
        FirstName = string.Empty;
        LastName = string.Empty;
        Phone = string.Empty;
    }

    private PrescriptionSubmission(
        string idempotencyKey,
        PatientIdentity patient,
        DateTime plannedVisitAt,
        bool hasAlreadyVisited,
        DateTimeOffset submittedAt)
    {
        Id = Guid.NewGuid();
        IdempotencyKey = idempotencyKey;
        FirstName = patient.FirstName;
        LastName = patient.LastName;
        BirthDate = patient.BirthDate;
        Phone = patient.Phone;
        PlannedVisitAt = plannedVisitAt;
        HasAlreadyVisited = hasAlreadyVisited;
        SubmittedAt = submittedAt;
    }

    /// <summary>
    /// Un nouvel envoi. Un client déjà venu n'a ni carte Vitale ni mutuelle à fournir : si elles arrivent
    /// quand même, elles sont écartées plutôt que gardées pour rien.
    /// </summary>
    public static PrescriptionSubmission Submit(
        string idempotencyKey,
        PatientIdentity patient,
        DateTime plannedVisitAt,
        bool hasAlreadyVisited,
        SocialSecurityNumber? socialSecurityNumber,
        IReadOnlyCollection<DocumentDraft> documentDrafts,
        DateTimeOffset submittedAt)
    {
        var trimmedKey = idempotencyKey.Trim();
        if (trimmedKey.Length == 0 || trimmedKey.Length > MaximumIdempotencyKeyLength)
        {
            throw new InvalidPrescriptionException("L’identifiant de l’envoi est obligatoire.");
        }

        if (documentDrafts.GroupBy(draft => draft.Kind).Any(sameKind => sameKind.Count() > 1))
        {
            throw new InvalidPrescriptionException("Chaque document ne peut être envoyé qu’une fois.");
        }

        if (documentDrafts.All(draft => draft.Kind != DocumentKind.Prescription))
        {
            throw new InvalidPrescriptionException("L’ordonnance est obligatoire.");
        }

        var submission = new PrescriptionSubmission(trimmedKey, patient, plannedVisitAt, hasAlreadyVisited, submittedAt);
        var keptDrafts = hasAlreadyVisited ? documentDrafts.Where(draft => draft.Kind == DocumentKind.Prescription) : documentDrafts;
        submission.documents.AddRange(keptDrafts.Select(draft => new SubmittedDocument(submission.Id, draft)));
        submission.SocialSecurityNumber = hasAlreadyVisited ? null : socialSecurityNumber?.Value;
        return submission;
    }
}

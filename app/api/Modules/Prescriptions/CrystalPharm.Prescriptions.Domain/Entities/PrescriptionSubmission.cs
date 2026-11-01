using CrystalPharm.Prescriptions.Domain.ValueObjects;
using CrystalPharm.SharedKernel.Tenancy;

namespace CrystalPharm.Prescriptions.Domain.Entities;

/// <summary>
/// Ce qu'un Visitor envoie depuis le site d'une pharmacie : son ordonnance et, s'il veut gagner du temps
/// au comptoir, sa carte Vitale et sa mutuelle ; puis son suivi par l'équipe. Donnée de santé.
/// </summary>
public sealed class PrescriptionSubmission : ITenantOwned
{
    public const int MaximumIdempotencyKeyLength = 100;
    public const int MaximumPrescriptionPages = 4;
    public const int MaximumTeamNoteLength = 1000;

    /// <summary>
    /// L'officine garde l'ordonnance dans son propre logiciel : la copie reçue en ligne ne sert qu'à
    /// préparer. Elle est effacée un mois après le retrait, trois mois après l'envoi au plus tard.
    /// </summary>
    public static readonly TimeSpan RetentionAfterCollection = TimeSpan.FromDays(30);
    public static readonly TimeSpan MaximumRetention = TimeSpan.FromDays(90);

    private readonly List<SubmittedDocument> documents = [];

    public Guid Id { get; private set; }
    public Guid TenantId { get; private set; }

    /// <summary>Choisie par `site` pour un envoi : la rejouer ne crée jamais un second envoi.</summary>
    public string IdempotencyKey { get; private set; }

    public string FirstName { get; private set; }
    public string LastName { get; private set; }
    public DateOnly BirthDate { get; private set; }
    public string Phone { get; private set; }
    public string? Email { get; private set; }

    /// <summary>Date et heure locales de la pharmacie, sans fuseau ; aucune : « dès que c'est prêt ».</summary>
    public DateTime? PlannedVisitAt { get; private set; }

    public bool HasAlreadyVisited { get; private set; }
    public bool IsRenewal { get; private set; }
    public string? NoteFromPatient { get; private set; }
    public string? SocialSecurityNumber { get; private set; }
    public DateTimeOffset SubmittedAt { get; private set; }

    public PrescriptionStatus Status { get; private set; }
    public DateTimeOffset StatusChangedAt { get; private set; }

    /// <summary>Le jour où les produits manquants doivent arriver, seulement quand on les attend.</summary>
    public DateOnly? ExpectedProductsOn { get; private set; }

    /// <summary>Ce que l'équipe se note, jamais montré au patient.</summary>
    public string? TeamNote { get; private set; }

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
        PatientEmail? email,
        SubmissionRequest request,
        DateTimeOffset submittedAt)
    {
        Id = Guid.NewGuid();
        IdempotencyKey = idempotencyKey;
        FirstName = patient.FirstName;
        LastName = patient.LastName;
        BirthDate = patient.BirthDate;
        Phone = patient.Phone;
        Email = email?.Value;
        PlannedVisitAt = request.PlannedVisitAt;
        HasAlreadyVisited = request.HasAlreadyVisited;
        IsRenewal = request.IsRenewal;
        NoteFromPatient = request.NoteFromPatient;
        SubmittedAt = submittedAt;
        Status = PrescriptionStatus.Received;
        StatusChangedAt = submittedAt;
    }

    /// <summary>
    /// Un nouvel envoi. Un client déjà venu n'a ni carte Vitale ni mutuelle à fournir : si elles arrivent
    /// quand même, elles sont écartées plutôt que gardées pour rien.
    /// </summary>
    public static PrescriptionSubmission Submit(
        string idempotencyKey,
        PatientIdentity patient,
        PatientEmail? email,
        SubmissionRequest request,
        SocialSecurityNumber? socialSecurityNumber,
        IReadOnlyCollection<DocumentDraft> documentDrafts,
        DateTimeOffset submittedAt)
    {
        var trimmedKey = idempotencyKey.Trim();
        if (trimmedKey.Length == 0 || trimmedKey.Length > MaximumIdempotencyKeyLength)
        {
            throw new InvalidPrescriptionException("L’identifiant de l’envoi est obligatoire.");
        }

        var prescriptionPageCount = documentDrafts.Count(draft => draft.Kind == DocumentKind.Prescription);
        if (prescriptionPageCount == 0)
        {
            throw new InvalidPrescriptionException("L’ordonnance est obligatoire.");
        }

        if (prescriptionPageCount > MaximumPrescriptionPages)
        {
            throw new InvalidPrescriptionException($"Une ordonnance compte {MaximumPrescriptionPages} pages au plus.");
        }

        var cardDrafts = documentDrafts.Where(draft => draft.Kind != DocumentKind.Prescription);
        if (cardDrafts.GroupBy(draft => draft.Kind).Any(sameKind => sameKind.Count() > 1))
        {
            throw new InvalidPrescriptionException("Chaque carte ne peut être envoyée qu’une fois.");
        }

        var submission = new PrescriptionSubmission(trimmedKey, patient, email, request, submittedAt);
        var keptDrafts = request.HasAlreadyVisited
            ? documentDrafts.Where(draft => draft.Kind == DocumentKind.Prescription)
            : documentDrafts;
        submission.documents.AddRange(keptDrafts.Select(draft => new SubmittedDocument(submission.Id, draft)));
        submission.SocialSecurityNumber = request.HasAlreadyVisited ? null : socialSecurityNumber?.Value;
        return submission;
    }

    /// <summary>
    /// L'équipe fait avancer la préparation, ou corrige une erreur : tout statut peut en suivre un autre.
    /// Le jour d'arrivée des produits n'a de sens que tant qu'on les attend.
    /// </summary>
    public void MoveTo(PrescriptionStatus status, DateOnly? expectedProductsOn, DateTimeOffset now)
    {
        if (status == PrescriptionStatus.WaitingForProducts && expectedProductsOn < DateOnly.FromDateTime(now.UtcDateTime))
        {
            throw new InvalidPrescriptionException("Le jour d’arrivée des produits ne peut pas être passé.");
        }

        Status = status;
        StatusChangedAt = now;
        ExpectedProductsOn = status == PrescriptionStatus.WaitingForProducts ? expectedProductsOn : null;
    }

    public void WriteTeamNote(string? note)
    {
        var trimmedNote = note?.Trim();
        if (trimmedNote?.Length > MaximumTeamNoteLength)
        {
            throw new InvalidPrescriptionException($"La note de l’équipe fait {MaximumTeamNoteLength} caractères au plus.");
        }

        TeamNote = string.IsNullOrEmpty(trimmedNote) ? null : trimmedNote;
    }

    public bool IsPastRetention(DateTimeOffset now) =>
        now - SubmittedAt > MaximumRetention
        || (Status == PrescriptionStatus.Collected && now - StatusChangedAt > RetentionAfterCollection);
}

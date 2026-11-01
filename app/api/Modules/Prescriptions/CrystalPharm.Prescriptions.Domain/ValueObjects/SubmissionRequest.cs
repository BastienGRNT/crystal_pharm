namespace CrystalPharm.Prescriptions.Domain.ValueObjects;

/// <summary>
/// Ce que le patient demande avec son ordonnance : quand il pense passer (rien : « dès que c'est prêt »),
/// s'il est déjà venu, s'il s'agit d'un renouvellement et son mot pour l'équipe.
/// </summary>
public sealed record SubmissionRequest
{
    public const int MaximumNoteLength = 500;

    public DateTime? PlannedVisitAt { get; }
    public bool HasAlreadyVisited { get; }
    public bool IsRenewal { get; }
    public string? NoteFromPatient { get; }

    public SubmissionRequest(DateTime? plannedVisitAt, bool hasAlreadyVisited, bool isRenewal, string? noteFromPatient)
    {
        var trimmedNote = noteFromPatient?.Trim();
        if (trimmedNote?.Length > MaximumNoteLength)
        {
            throw new InvalidPrescriptionException($"Le message pour l’équipe fait {MaximumNoteLength} caractères au plus.");
        }

        PlannedVisitAt = plannedVisitAt;
        HasAlreadyVisited = hasAlreadyVisited;
        IsRenewal = isRenewal;
        NoteFromPatient = string.IsNullOrEmpty(trimmedNote) ? null : trimmedNote;
    }
}

namespace CrystalPharm.Booking.Domain.Configuration;

/// <summary>Un motif de rendez-vous que la pharmacie propose, et le temps qu'il lui prend.</summary>
public sealed record AppointmentReason(
    Guid Id,
    string Label,
    string? Description,
    string? PreparationNote,
    int DurationMinutes,
    bool IsActive)
{
    public const int MaximumLabelLength = 60;
    public const int MaximumTextLength = 300;
    public const int MinimumDurationMinutes = 5;
    public const int MaximumDurationMinutes = 240;
    public const int DurationStepMinutes = 5;

    internal void EnsureIsValid()
    {
        if (Id == Guid.Empty)
        {
            throw new InvalidAppointmentException("Chaque motif a un identifiant.");
        }

        if (string.IsNullOrWhiteSpace(Label) || Label.Trim().Length > MaximumLabelLength)
        {
            throw new InvalidAppointmentException($"Le nom d’un motif est obligatoire, {MaximumLabelLength} caractères au plus.");
        }

        if (Description?.Length > MaximumTextLength || PreparationNote?.Length > MaximumTextLength)
        {
            throw new InvalidAppointmentException($"La description et la préparation d’un motif font {MaximumTextLength} caractères au plus.");
        }

        if (DurationMinutes is < MinimumDurationMinutes or > MaximumDurationMinutes || DurationMinutes % DurationStepMinutes != 0)
        {
            throw new InvalidAppointmentException(
                $"La durée d’un motif va de {MinimumDurationMinutes} à {MaximumDurationMinutes} minutes, par pas de {DurationStepMinutes}.");
        }
    }
}

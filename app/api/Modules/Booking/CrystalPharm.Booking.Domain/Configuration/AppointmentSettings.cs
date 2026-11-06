namespace CrystalPharm.Booking.Domain.Configuration;

/// <summary>Les règles générales de la prise de rendez-vous d'une pharmacie.</summary>
public sealed record AppointmentSettings(
    bool IsBookingOpen,
    bool ConfirmsAutomatically,
    int SlotStepMinutes,
    int MinimumNoticeMinutes,
    int MaximumAdvanceDays,
    int BufferMinutes,
    string? ConfirmationMessage)
{
    public const int MaximumConfirmationMessageLength = 500;
    public const int MaximumMinimumNoticeMinutes = 7 * 24 * 60;
    public const int MaximumMaximumAdvanceDays = 365;
    public const int MaximumBufferMinutes = 60;

    private static readonly int[] AllowedSlotSteps = [5, 10, 15, 20, 30, 60];

    public static AppointmentSettings Default { get; } = new(
        IsBookingOpen: true,
        ConfirmsAutomatically: false,
        SlotStepMinutes: 15,
        MinimumNoticeMinutes: 120,
        MaximumAdvanceDays: 60,
        BufferMinutes: 0,
        ConfirmationMessage: null);

    internal void EnsureIsValid()
    {
        if (!AllowedSlotSteps.Contains(SlotStepMinutes))
        {
            throw new InvalidAppointmentException($"Les créneaux se proposent toutes les {string.Join(", ", AllowedSlotSteps)} minutes.");
        }

        if (MinimumNoticeMinutes is < 0 or > MaximumMinimumNoticeMinutes)
        {
            throw new InvalidAppointmentException("Le délai minimum avant un rendez-vous va de 0 à 7 jours.");
        }

        if (MaximumAdvanceDays is < 1 or > MaximumMaximumAdvanceDays)
        {
            throw new InvalidAppointmentException($"On peut réserver de 1 à {MaximumMaximumAdvanceDays} jours à l’avance.");
        }

        if (BufferMinutes is < 0 or > MaximumBufferMinutes)
        {
            throw new InvalidAppointmentException($"La pause entre deux rendez-vous va de 0 à {MaximumBufferMinutes} minutes.");
        }

        if (ConfirmationMessage?.Length > MaximumConfirmationMessageLength)
        {
            throw new InvalidAppointmentException($"Le message de confirmation fait {MaximumConfirmationMessageLength} caractères au plus.");
        }
    }
}

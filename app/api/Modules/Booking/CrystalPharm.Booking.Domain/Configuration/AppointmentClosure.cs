namespace CrystalPharm.Booking.Domain.Configuration;

/// <summary>Des jours sans rendez-vous (vacances, jour férié), du premier au dernier inclus.</summary>
public sealed record AppointmentClosure(DateOnly FirstDay, DateOnly LastDay, string? Label)
{
    public const int MaximumLabelLength = 60;

    public bool Covers(DateOnly day) => FirstDay <= day && day <= LastDay;

    internal void EnsureIsValid()
    {
        if (LastDay < FirstDay)
        {
            throw new InvalidAppointmentException("Une fermeture se termine le jour de son début, ou après.");
        }

        if (Label?.Length > MaximumLabelLength)
        {
            throw new InvalidAppointmentException($"Le nom d’une fermeture fait {MaximumLabelLength} caractères au plus.");
        }
    }
}

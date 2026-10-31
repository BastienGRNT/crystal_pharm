namespace CrystalPharm.Booking.Domain.Configuration;

/// <summary>Une plage où une personne de l'équipe reçoit sur rendez-vous, chaque semaine (1 = lundi … 7 = dimanche).</summary>
public sealed record WeeklyAvailabilityWindow(Guid EmployeeId, int IsoDayOfWeek, TimeOnly StartTime, TimeOnly EndTime)
{
    internal void EnsureIsValid()
    {
        if (EmployeeId == Guid.Empty)
        {
            throw new InvalidAppointmentException("Chaque plage horaire est celle d’une personne de l’équipe.");
        }

        if (IsoDayOfWeek is < 1 or > 7)
        {
            throw new InvalidAppointmentException("Le jour d’une plage horaire va de 1 (lundi) à 7 (dimanche).");
        }

        if (EndTime <= StartTime)
        {
            throw new InvalidAppointmentException("Une plage horaire se termine après son début.");
        }
    }

    internal bool Overlaps(WeeklyAvailabilityWindow other) =>
        EmployeeId == other.EmployeeId && IsoDayOfWeek == other.IsoDayOfWeek && StartTime < other.EndTime && other.StartTime < EndTime;
}

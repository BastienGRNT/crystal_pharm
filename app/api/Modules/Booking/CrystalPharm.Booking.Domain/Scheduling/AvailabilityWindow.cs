namespace CrystalPharm.Booking.Domain.Scheduling;

/// <summary>Une plage d'un jour précis où une personne de l'équipe peut recevoir un patient.</summary>
public sealed record AvailabilityWindow(Guid EmployeeId, DateOnly Day, TimeOnly StartTime, TimeOnly EndTime);

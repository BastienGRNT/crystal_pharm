namespace CrystalPharm.Booking.Application.Dtos;

/// <summary>Une plage où une personne de l'équipe peut recevoir des patients, lue dans le planning.</summary>
public sealed record StaffAvailabilityWindow(Guid EmployeeId, DateOnly Day, TimeOnly StartTime, TimeOnly EndTime);

namespace CrystalPharm.Booking.Domain.Scheduling;

/// <summary>Un créneau libre pour un motif, et la personne qui le recevrait.</summary>
public sealed record PlannedSlot(Guid EmployeeId, DateOnly Day, TimeOnly StartTime, TimeOnly EndTime);

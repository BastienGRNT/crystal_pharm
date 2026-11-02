namespace CrystalPharm.Booking.Domain.Scheduling;

/// <summary>Un rendez-vous non annulé, tel que le voit le calcul des créneaux.</summary>
public sealed record BookedPeriod(Guid EmployeeId, DateOnly Day, TimeOnly StartTime, TimeOnly EndTime);

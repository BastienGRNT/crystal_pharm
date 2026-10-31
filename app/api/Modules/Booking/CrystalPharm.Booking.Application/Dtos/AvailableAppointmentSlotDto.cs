namespace CrystalPharm.Booking.Application.Dtos;

/// <summary>Un créneau libre proposé au Visitor ; <c>SlotId</c> est opaque, seule l'API sait à qui il correspond.</summary>
public sealed record AvailableAppointmentSlotDto(string SlotId, DateTimeOffset StartsAt, DateTimeOffset EndsAt);

namespace CrystalPharm.Booking.Application.Dtos;

/// <summary>Un jour où il reste au moins un créneau pour le motif demandé.</summary>
public sealed record AvailableAppointmentDayDto(DateOnly Day, int FreeSlotCount);

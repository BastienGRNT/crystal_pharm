namespace CrystalPharm.Booking.Application.Dtos;

public sealed record VisitorAppointmentRequestDto(
    string SlotId,
    Guid ReasonId,
    string FirstName,
    string LastName,
    string Phone,
    string? Note = null);

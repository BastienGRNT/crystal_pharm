namespace CrystalPharm.Booking.Application.Dtos;

public sealed record VisitorAppointmentRequestDto(string SlotId, string FirstName, string LastName, string Phone, string Reason);

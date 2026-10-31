namespace CrystalPharm.Booking.Application.Dtos;

/// <summary>Ce que le patient reçoit une fois sa demande enregistrée.</summary>
public sealed record VisitorAppointmentConfirmationDto(
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    string ReasonLabel,
    bool IsConfirmed,
    string? ConfirmationMessage);

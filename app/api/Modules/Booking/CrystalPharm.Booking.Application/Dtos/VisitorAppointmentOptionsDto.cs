namespace CrystalPharm.Booking.Application.Dtos;

/// <summary>Ce que le formulaire du site propose au Visitor : les motifs ouverts et les règles qui le concernent.</summary>
public sealed record VisitorAppointmentOptionsDto(
    bool IsBookingOpen,
    int MaximumAdvanceDays,
    IReadOnlyList<VisitorAppointmentReasonDto> Reasons);

public sealed record VisitorAppointmentReasonDto(
    Guid Id,
    string Label,
    string? Description,
    string? PreparationNote,
    int DurationMinutes);

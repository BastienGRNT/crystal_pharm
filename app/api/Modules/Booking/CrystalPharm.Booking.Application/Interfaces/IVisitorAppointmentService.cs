using CrystalPharm.Booking.Application.Dtos;

namespace CrystalPharm.Booking.Application.Interfaces;

/// <summary>La prise de rendez-vous du Visitor, depuis le site de la pharmacie.</summary>
public interface IVisitorAppointmentService
{
    /// <summary>Les créneaux encore libres du jour, dans l'ordre ; aucun pour un jour passé.</summary>
    Task<IReadOnlyList<AvailableAppointmentSlotDto>> ListAvailableSlotsAsync(DateOnly day, CancellationToken cancellationToken);

    /// <exception cref="Domain.InvalidAppointmentException">Quand une saisie du patient n'est pas valable.</exception>
    Task<VisitorAppointmentResult> RequestAsync(VisitorAppointmentRequestDto request, CancellationToken cancellationToken);
}

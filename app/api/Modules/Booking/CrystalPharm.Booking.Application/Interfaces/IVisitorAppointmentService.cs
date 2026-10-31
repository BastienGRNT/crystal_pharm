using CrystalPharm.Booking.Application.Dtos;

namespace CrystalPharm.Booking.Application.Interfaces;

/// <summary>La prise de rendez-vous du Visitor, depuis le site de la pharmacie.</summary>
public interface IVisitorAppointmentService
{
    /// <summary>Deux mois au plus par lecture : la vue la plus large du calendrier du site.</summary>
    const int MaximumDaysPerAvailabilityListing = 62;

    Task<VisitorAppointmentOptionsDto> GetOptionsAsync(CancellationToken cancellationToken);

    /// <summary>Les jours de la période où il reste un créneau pour le motif, dans l'ordre ; vide si le motif n'est pas proposé.</summary>
    Task<IReadOnlyList<AvailableAppointmentDayDto>> ListAvailableDaysAsync(
        Guid reasonId,
        DateOnly firstDay,
        DateOnly lastDay,
        CancellationToken cancellationToken);

    /// <summary>Les créneaux encore libres du jour pour le motif, dans l'ordre ; aucun pour un jour fermé ou passé.</summary>
    Task<IReadOnlyList<AvailableAppointmentSlotDto>> ListAvailableSlotsAsync(Guid reasonId, DateOnly day, CancellationToken cancellationToken);

    /// <exception cref="Domain.InvalidAppointmentException">Quand une saisie du patient n'est pas valable.</exception>
    Task<VisitorAppointmentResult> RequestAsync(VisitorAppointmentRequestDto request, CancellationToken cancellationToken);
}

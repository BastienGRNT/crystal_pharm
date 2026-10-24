using CrystalPharm.Booking.Application.Dtos;

namespace CrystalPharm.Booking.Application.Interfaces;

public interface IAppointmentService
{
    /// <summary>Un mois au plus par lecture : la vue la plus large de la pharmacie.</summary>
    const int MaximumDaysPerListing = 31;

    Task<IReadOnlyList<AppointmentDto>> ListOfDaysAsync(IReadOnlyCollection<DateOnly> days, CancellationToken cancellationToken);

    Task<AppointmentDto?> FindAsync(Guid appointmentId, CancellationToken cancellationToken);

    /// <exception cref="Domain.InvalidAppointmentException">Quand une règle du rendez-vous n'est pas respectée.</exception>
    Task<AppointmentSchedulingResult> ScheduleAsync(NewAppointmentDto newAppointment, CancellationToken cancellationToken);

    /// <returns><c>false</c> si le rendez-vous n'existe pas ou n'était plus en attente.</returns>
    Task<bool> ConfirmAsync(Guid appointmentId, CancellationToken cancellationToken);

    /// <returns><c>false</c> si le rendez-vous n'existe pas ou était déjà annulé.</returns>
    Task<bool> CancelAsync(Guid appointmentId, CancellationToken cancellationToken);
}

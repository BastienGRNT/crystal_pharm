using CrystalPharm.Booking.Domain.Entities;

namespace CrystalPharm.Booking.Application.Interfaces;

/// <summary>Les rendez-vous du Tenant de la requête : jamais ceux d'un autre.</summary>
public interface IAppointmentRepository
{
    Task<IReadOnlyList<Appointment>> ListOfDaysAsync(IReadOnlyCollection<DateOnly> days, CancellationToken cancellationToken);

    Task<Appointment?> FindAsync(Guid appointmentId, CancellationToken cancellationToken);

    void Add(Appointment appointment);

    /// <exception cref="AppointmentSlotAlreadyTakenException">Quand le créneau est déjà pris.</exception>
    Task SaveChangesAsync(CancellationToken cancellationToken);
}

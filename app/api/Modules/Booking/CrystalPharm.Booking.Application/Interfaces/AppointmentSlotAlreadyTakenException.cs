namespace CrystalPharm.Booking.Application.Interfaces;

/// <summary>
/// Levée par <see cref="IAppointmentRepository.SaveChangesAsync"/> quand la base refuse
/// une double réservation (contrainte d'exclusion), même entre deux requêtes simultanées.
/// </summary>
public sealed class AppointmentSlotAlreadyTakenException(Exception innerException)
    : Exception("The employee already has an appointment overlapping this slot.", innerException);

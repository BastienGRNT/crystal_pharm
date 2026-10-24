namespace CrystalPharm.Booking.Application.Interfaces;

/// <summary>
/// La trace de chaque lecture d'une donnée de santé : qui (le contexte de la requête),
/// quand (l'horloge) et quoi (l'action et les rendez-vous lus).
/// </summary>
public interface IHealthDataAccessLog
{
    Task RecordAsync(string action, IReadOnlyCollection<Guid> appointmentIds, CancellationToken cancellationToken);
}

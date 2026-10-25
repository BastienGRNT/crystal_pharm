namespace CrystalPharm.Prescriptions.Application.Interfaces;

/// <summary>
/// La trace de chaque lecture d'une donnée de santé : qui (le contexte de la requête),
/// quand (l'horloge) et quoi (l'action et les envois lus).
/// </summary>
public interface IPrescriptionAccessLog
{
    Task RecordAsync(string action, IReadOnlyCollection<Guid> submissionIds, CancellationToken cancellationToken);
}

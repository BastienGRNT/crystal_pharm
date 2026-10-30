namespace CrystalPharm.Prescriptions.Application.Interfaces;

/// <summary>
/// Levée par <see cref="IPrescriptionSubmissionRepository.SaveChangesAsync"/> quand un envoi de même
/// clé d'idempotence existe déjà, même entre deux requêtes simultanées.
/// </summary>
public sealed class DuplicateSubmissionException(Exception innerException)
    : Exception("Un envoi avec cet identifiant existe déjà.", innerException);

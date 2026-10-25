using CrystalPharm.Prescriptions.Domain.Entities;

namespace CrystalPharm.Prescriptions.Application.Interfaces;

/// <summary>Les envois d'ordonnance du Tenant de la requête : jamais ceux d'un autre.</summary>
public interface IPrescriptionSubmissionRepository
{
    Task<PrescriptionSubmission?> FindByIdempotencyKeyAsync(string idempotencyKey, CancellationToken cancellationToken);

    /// <summary>Les envois les plus récents d'abord, avec leurs fichiers.</summary>
    Task<IReadOnlyList<PrescriptionSubmission>> ListLatestAsync(int limit, CancellationToken cancellationToken);

    Task<PrescriptionSubmission?> FindAsync(Guid submissionId, CancellationToken cancellationToken);

    void Add(PrescriptionSubmission submission);

    /// <exception cref="DuplicateSubmissionException">Quand un envoi de même clé d'idempotence existe déjà.</exception>
    Task SaveChangesAsync(CancellationToken cancellationToken);
}

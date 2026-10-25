using CrystalPharm.Prescriptions.Application.Dtos;

namespace CrystalPharm.Prescriptions.Application.Interfaces;

public interface IPrescriptionSubmissionService
{
    /// <exception cref="CrystalPharm.Prescriptions.Domain.InvalidPrescriptionException">Quand l'envoi enfreint une règle.</exception>
    Task<PrescriptionSubmissionResult> SubmitAsync(NewPrescriptionSubmissionDto newSubmission, CancellationToken cancellationToken);

    Task<IReadOnlyList<ReceivedPrescriptionSummaryDto>> ListReceivedAsync(CancellationToken cancellationToken);

    Task<ReceivedPrescriptionDto?> FindReceivedAsync(Guid submissionId, CancellationToken cancellationToken);

    /// <summary><c>null</c> quand l'envoi ou le fichier n'existe pas pour ce Tenant.</summary>
    Task<ReceivedDocumentContent?> OpenReceivedDocumentAsync(Guid submissionId, Guid documentId, CancellationToken cancellationToken);
}

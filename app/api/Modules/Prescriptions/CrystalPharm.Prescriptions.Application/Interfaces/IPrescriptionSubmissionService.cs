using CrystalPharm.Prescriptions.Application.Dtos;

namespace CrystalPharm.Prescriptions.Application.Interfaces;

public interface IPrescriptionSubmissionService
{
    /// <exception cref="CrystalPharm.Prescriptions.Domain.InvalidPrescriptionException">Quand l'envoi enfreint une règle.</exception>
    Task<PrescriptionSubmissionResult> SubmitAsync(NewPrescriptionSubmissionDto newSubmission, CancellationToken cancellationToken);

    /// <summary>Efface d'abord les envois arrivés au bout de leur durée de conservation.</summary>
    Task<IReadOnlyList<ReceivedPrescriptionSummaryDto>> ListReceivedAsync(CancellationToken cancellationToken);

    Task<ReceivedPrescriptionDto?> FindReceivedAsync(Guid submissionId, CancellationToken cancellationToken);

    /// <summary><c>null</c> quand l'envoi ou le fichier n'existe pas pour ce Tenant.</summary>
    Task<ReceivedDocumentContent?> OpenReceivedDocumentAsync(Guid submissionId, Guid documentId, CancellationToken cancellationToken);

    /// <summary>L'envoi à jour, avec l'adresse du patient pour le prévenir ; <c>null</c> quand il n'existe pas.</summary>
    /// <exception cref="CrystalPharm.Prescriptions.Domain.InvalidPrescriptionException">Quand le changement enfreint une règle.</exception>
    Task<ReceivedPrescriptionDto?> ChangeStatusAsync(Guid submissionId, PrescriptionStatusChangeDto change, CancellationToken cancellationToken);

    /// <exception cref="CrystalPharm.Prescriptions.Domain.InvalidPrescriptionException">Quand la note est trop longue.</exception>
    Task<ReceivedPrescriptionDto?> WriteTeamNoteAsync(Guid submissionId, PrescriptionTeamNoteDto teamNote, CancellationToken cancellationToken);

    /// <summary>Efface l'envoi et ses fichiers (à la demande du patient) ; faux quand il n'existe pas.</summary>
    Task<bool> DeleteAsync(Guid submissionId, CancellationToken cancellationToken);
}

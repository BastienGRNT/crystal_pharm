using CrystalPharm.Prescriptions.Application.Dtos;

namespace CrystalPharm.Prescriptions.Application.Interfaces;

public interface IPrescriptionSubmissionService
{
    /// <exception cref="CrystalPharm.Prescriptions.Domain.InvalidPrescriptionException">Quand l'envoi enfreint une règle.</exception>
    Task<PrescriptionSubmissionResult> SubmitAsync(NewPrescriptionSubmissionDto newSubmission, CancellationToken cancellationToken);

    /// <summary>
    /// Enregistre un envoi dont le navigateur déposera lui-même les fichiers, et renvoie un lien pré-signé par fichier.
    /// Rejouer la même clé renvoie le même envoi, avec des liens neufs tant qu'il n'est pas confirmé.
    /// </summary>
    /// <exception cref="CrystalPharm.Prescriptions.Domain.InvalidPrescriptionException">Quand l'envoi enfreint une règle.</exception>
    Task<PrescriptionUploadStartResult> StartUploadAsync(NewPrescriptionUploadDto newUpload, CancellationToken cancellationToken);

    /// <summary>
    /// Vérifie les fichiers déposés et fait arriver l'envoi chez l'équipe ; <c>null</c> quand aucun envoi n'a cette clé.
    /// Un fichier refusé efface tout l'envoi.
    /// </summary>
    /// <exception cref="CrystalPharm.Prescriptions.Domain.InvalidPrescriptionException">Quand un fichier manque ou est refusé.</exception>
    Task<PrescriptionSubmissionResult?> CompleteUploadAsync(string idempotencyKey, CancellationToken cancellationToken);

    /// <summary>Efface d'abord les envois arrivés au bout de leur durée de conservation.</summary>
    Task<IReadOnlyList<ReceivedPrescriptionSummaryDto>> ListReceivedAsync(CancellationToken cancellationToken);

    Task<ReceivedPrescriptionDto?> FindReceivedAsync(Guid submissionId, CancellationToken cancellationToken);

    /// <summary><c>null</c> quand l'envoi ou le fichier n'existe pas pour ce Tenant.</summary>
    Task<ReceivedDocumentContent?> OpenReceivedDocumentAsync(Guid submissionId, Guid documentId, CancellationToken cancellationToken);

    /// <summary>Un lien pré-signé court pour afficher le fichier ; <c>null</c> quand l'envoi ou le fichier n'existe pas pour ce Tenant.</summary>
    Task<ReceivedDocumentLinkDto?> CreateReceivedDocumentLinkAsync(Guid submissionId, Guid documentId, CancellationToken cancellationToken);

    /// <summary>L'envoi à jour, avec l'adresse du patient pour le prévenir ; <c>null</c> quand il n'existe pas.</summary>
    /// <exception cref="CrystalPharm.Prescriptions.Domain.InvalidPrescriptionException">Quand le changement enfreint une règle.</exception>
    Task<ReceivedPrescriptionDto?> ChangeStatusAsync(Guid submissionId, PrescriptionStatusChangeDto change, CancellationToken cancellationToken);

    /// <exception cref="CrystalPharm.Prescriptions.Domain.InvalidPrescriptionException">Quand la note est trop longue.</exception>
    Task<ReceivedPrescriptionDto?> WriteTeamNoteAsync(Guid submissionId, PrescriptionTeamNoteDto teamNote, CancellationToken cancellationToken);

    /// <summary>Efface l'envoi et ses fichiers (à la demande du patient) ; faux quand il n'existe pas.</summary>
    Task<bool> DeleteAsync(Guid submissionId, CancellationToken cancellationToken);
}

namespace CrystalPharm.Prescriptions.Application.Dtos;

/// <param name="SubmissionId">L'identifiant de l'envoi, rien de ce qu'il contient.</param>
/// <param name="AlreadyReceived">Vrai quand l'envoi avait déjà été reçu avec cette clé d'idempotence.</param>
public sealed record PrescriptionSubmissionResult(Guid SubmissionId, bool AlreadyReceived);

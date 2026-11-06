namespace CrystalPharm.Prescriptions.Domain.Entities;

/// <summary>Où en est la préparation d'un envoi, du point de vue de l'équipe.</summary>
public enum PrescriptionStatus
{
    Received,
    InPreparation,
    WaitingForProducts,
    Ready,
    Collected,
}

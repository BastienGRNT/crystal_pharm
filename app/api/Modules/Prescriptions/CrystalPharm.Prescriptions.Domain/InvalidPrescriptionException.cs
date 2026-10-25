namespace CrystalPharm.Prescriptions.Domain;

/// <summary>
/// Un envoi d'ordonnance refusé par une règle du domaine. Son message est fixe, en français,
/// et ne reprend jamais la saisie reçue : il peut être renvoyé tel quel.
/// </summary>
public sealed class InvalidPrescriptionException(string message) : Exception(message);

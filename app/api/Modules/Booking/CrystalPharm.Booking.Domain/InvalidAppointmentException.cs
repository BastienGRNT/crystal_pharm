namespace CrystalPharm.Booking.Domain;

/// <summary>
/// Un rendez-vous refusé par une règle du domaine. Son message est fixe, en français,
/// et ne reprend jamais la saisie reçue : il peut être renvoyé tel quel.
/// </summary>
public sealed class InvalidAppointmentException(string message) : Exception(message);

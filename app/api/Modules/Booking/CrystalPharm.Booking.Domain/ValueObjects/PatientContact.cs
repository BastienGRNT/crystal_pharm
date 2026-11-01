using System.Text.RegularExpressions;

namespace CrystalPharm.Booking.Domain.ValueObjects;

/// <summary>
/// Le nom du patient, le téléphone où le joindre et, s'il veut être prévenu, son email ; sans espaces superflus.
/// </summary>
public sealed partial record PatientContact
{
    public const int MaximumNameLength = 100;
    public const int MaximumPhoneLength = 30;
    public const int MaximumEmailLength = 254;

    public string Name { get; }
    public string Phone { get; }
    public string? Email { get; }

    public PatientContact(string name, string phone, string? email = null)
    {
        var trimmedName = name.Trim();
        var trimmedPhone = phone.Trim();
        var normalizedEmail = email?.Trim().ToLowerInvariant();

        if (trimmedName.Length == 0 || trimmedName.Length > MaximumNameLength)
        {
            throw new InvalidAppointmentException($"Le nom du patient est obligatoire, {MaximumNameLength} caractères au plus.");
        }

        if (trimmedPhone.Length == 0 || trimmedPhone.Length > MaximumPhoneLength)
        {
            throw new InvalidAppointmentException($"Le téléphone du patient est obligatoire, {MaximumPhoneLength} caractères au plus.");
        }

        if (!string.IsNullOrEmpty(normalizedEmail)
            && (normalizedEmail.Length > MaximumEmailLength || !PlausibleEmail().IsMatch(normalizedEmail)))
        {
            throw new InvalidAppointmentException("L’adresse email n’est pas valide.");
        }

        Name = trimmedName;
        Phone = trimmedPhone;
        Email = string.IsNullOrEmpty(normalizedEmail) ? null : normalizedEmail;
    }

    [GeneratedRegex(@"^[^\s@]+@[^\s@]+\.[^\s@]+$")]
    private static partial Regex PlausibleEmail();
}

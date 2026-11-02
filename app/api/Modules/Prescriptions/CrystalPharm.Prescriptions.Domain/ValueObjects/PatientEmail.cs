using System.Text.RegularExpressions;

namespace CrystalPharm.Prescriptions.Domain.ValueObjects;

/// <summary>L'adresse où prévenir le patient, sans espaces et en minuscules.</summary>
public sealed partial record PatientEmail
{
    public const int MaximumLength = 254;

    public string Value { get; }

    public PatientEmail(string typed)
    {
        var normalized = typed.Trim().ToLowerInvariant();
        if (normalized.Length == 0)
        {
            throw new InvalidPrescriptionException("L’adresse email est obligatoire.");
        }

        if (normalized.Length > MaximumLength || !PlausibleEmail().IsMatch(normalized))
        {
            throw new InvalidPrescriptionException("L’adresse email n’est pas valide.");
        }

        Value = normalized;
    }

    [GeneratedRegex(@"^[^\s@]+@[^\s@]+\.[^\s@]+$")]
    private static partial Regex PlausibleEmail();
}

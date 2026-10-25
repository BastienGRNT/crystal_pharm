using System.Text.RegularExpressions;

namespace CrystalPharm.Prescriptions.Domain.ValueObjects;

/// <summary>Un numéro de sécurité sociale de 15 caractères, sans espaces, dont la clé de contrôle est juste.</summary>
public sealed partial record SocialSecurityNumber
{
    public const int Length = 15;

    public string Value { get; }

    public SocialSecurityNumber(string value)
    {
        var normalizedValue = string.Concat(value.Where(character => !char.IsWhiteSpace(character))).ToUpperInvariant();
        if (!HasValidShape(normalizedValue) || !HasValidControlKey(normalizedValue))
        {
            throw new InvalidPrescriptionException("Le numéro de sécurité sociale n’est pas valide.");
        }

        Value = normalizedValue;
    }

    private static bool HasValidShape(string value) => value.Length == Length && Shape().IsMatch(value);

    // La Corse (2A, 2B) compte pour 19 et 18 dans le calcul de la clé.
    private static bool HasValidControlKey(string value)
    {
        var numberWithoutKey = long.Parse(value[..13].Replace("2A", "19").Replace("2B", "18"));
        return 97 - (numberWithoutKey % 97) == int.Parse(value[13..]);
    }

    [GeneratedRegex(@"^[1-8]\d{4}(?:\d{2}|2[AB])\d{6}\d{2}$")]
    private static partial Regex Shape();
}

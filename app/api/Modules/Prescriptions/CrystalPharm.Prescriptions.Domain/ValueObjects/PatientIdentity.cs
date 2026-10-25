using System.Text.RegularExpressions;

namespace CrystalPharm.Prescriptions.Domain.ValueObjects;

/// <summary>Qui est le patient et comment le joindre, sans espaces superflus.</summary>
public sealed partial record PatientIdentity
{
    public const int MaximumNameLength = 100;
    public const int MaximumPhoneLength = 30;
    private const int OldestPlausibleBirthYear = 1900;

    public string FirstName { get; }
    public string LastName { get; }
    public DateOnly BirthDate { get; }
    public string Phone { get; }

    public PatientIdentity(string firstName, string lastName, DateOnly birthDate, string phone, DateOnly today)
    {
        FirstName = RequireName(firstName, "Le prénom");
        LastName = RequireName(lastName, "Le nom");

        if (birthDate > today || birthDate.Year < OldestPlausibleBirthYear)
        {
            throw new InvalidPrescriptionException("La date de naissance n’est pas valide.");
        }

        var trimmedPhone = phone.Trim();
        if (trimmedPhone.Length > MaximumPhoneLength || !FrenchPhone().IsMatch(trimmedPhone))
        {
            throw new InvalidPrescriptionException("Le numéro de téléphone n’est pas valide.");
        }

        BirthDate = birthDate;
        Phone = trimmedPhone;
    }

    private static string RequireName(string name, string label)
    {
        var trimmedName = name.Trim();
        if (trimmedName.Length == 0 || trimmedName.Length > MaximumNameLength)
        {
            throw new InvalidPrescriptionException($"{label} est obligatoire, {MaximumNameLength} caractères au plus.");
        }

        return trimmedName;
    }

    [GeneratedRegex(@"^(?:\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}$")]
    private static partial Regex FrenchPhone();
}

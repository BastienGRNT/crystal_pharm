namespace CrystalPharm.Booking.Domain.ValueObjects;

/// <summary>Le nom du patient et le téléphone où le joindre, sans espaces superflus.</summary>
public sealed record PatientContact
{
    public const int MaximumNameLength = 100;
    public const int MaximumPhoneLength = 30;

    public string Name { get; }
    public string Phone { get; }

    public PatientContact(string name, string phone)
    {
        var trimmedName = name.Trim();
        var trimmedPhone = phone.Trim();

        if (trimmedName.Length == 0 || trimmedName.Length > MaximumNameLength)
        {
            throw new InvalidAppointmentException($"Le nom du patient est obligatoire, {MaximumNameLength} caractères au plus.");
        }

        if (trimmedPhone.Length == 0 || trimmedPhone.Length > MaximumPhoneLength)
        {
            throw new InvalidAppointmentException($"Le téléphone du patient est obligatoire, {MaximumPhoneLength} caractères au plus.");
        }

        Name = trimmedName;
        Phone = trimmedPhone;
    }
}

namespace CrystalPharm.Prescriptions.Application.Interfaces;

public sealed class DuplicateSubmissionException : Exception
{
    public DuplicateSubmissionException(Exception innerException)
        : base("Un envoi avec cet identifiant existe déjà.", innerException)
    {
    }
}

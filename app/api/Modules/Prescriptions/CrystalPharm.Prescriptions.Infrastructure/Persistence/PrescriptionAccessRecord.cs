using CrystalPharm.SharedKernel.Tenancy;

namespace CrystalPharm.Prescriptions.Infrastructure.Persistence;

/// <summary>Une lecture d'ordonnance : qui, quand, quoi. Jamais modifiée ni supprimée.</summary>
internal sealed class PrescriptionAccessRecord : ITenantOwned
{
    public Guid Id { get; private set; }
    public Guid TenantId { get; private set; }
    public string CallerId { get; private set; }
    public string Action { get; private set; }
    public Guid[] SubmissionIds { get; private set; }
    public DateTimeOffset AccessedAt { get; private set; }

    public PrescriptionAccessRecord(string callerId, string action, Guid[] submissionIds, DateTimeOffset accessedAt)
    {
        Id = Guid.NewGuid();
        CallerId = callerId;
        Action = action;
        SubmissionIds = submissionIds;
        AccessedAt = accessedAt;
    }
}

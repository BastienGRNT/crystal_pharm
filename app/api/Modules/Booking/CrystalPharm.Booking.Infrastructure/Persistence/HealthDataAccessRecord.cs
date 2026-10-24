using CrystalPharm.SharedKernel.Tenancy;

namespace CrystalPharm.Booking.Infrastructure.Persistence;

/// <summary>Une lecture de rendez-vous : qui, quand, quoi. Jamais modifiée ni supprimée.</summary>
internal sealed class HealthDataAccessRecord : ITenantOwned
{
    public Guid Id { get; private set; }
    public Guid TenantId { get; private set; }
    public string CallerId { get; private set; }
    public string Action { get; private set; }
    public Guid[] AppointmentIds { get; private set; }
    public DateTimeOffset AccessedAt { get; private set; }

    public HealthDataAccessRecord(string callerId, string action, Guid[] appointmentIds, DateTimeOffset accessedAt)
    {
        Id = Guid.NewGuid();
        CallerId = callerId;
        Action = action;
        AppointmentIds = appointmentIds;
        AccessedAt = accessedAt;
    }
}

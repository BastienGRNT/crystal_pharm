using CrystalPharm.Booking.Domain.Configuration;
using CrystalPharm.SharedKernel.Tenancy;

namespace CrystalPharm.Booking.Infrastructure.Persistence;

/// <summary>La configuration des rendez-vous d'un Tenant, gardée telle quelle en JSON : une seule ligne par Tenant.</summary>
internal sealed class StoredAppointmentConfiguration : ITenantOwned
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid TenantId { get; private set; }
    public AppointmentConfiguration Configuration { get; set; } = AppointmentConfiguration.Default;
    public DateTimeOffset UpdatedAt { get; set; }
}

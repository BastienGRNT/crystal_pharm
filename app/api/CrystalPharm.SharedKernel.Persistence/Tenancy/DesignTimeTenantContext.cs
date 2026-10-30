using CrystalPharm.SharedKernel.Tenancy;

namespace CrystalPharm.SharedKernel.Persistence.Tenancy;

/// <summary>Pour <c>dotnet ef migrations add</c>, qui construit le modèle sans requête ni Tenant.</summary>
public sealed class DesignTimeTenantContext : ITenantContext
{
    public bool IsResolved => false;
    public Guid TenantId => throw new InvalidOperationException("No tenant at design time.");
    public string CallerId => throw new InvalidOperationException("No caller at design time.");
}

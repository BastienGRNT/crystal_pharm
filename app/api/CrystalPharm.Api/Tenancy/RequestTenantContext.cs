using CrystalPharm.SharedKernel.Tenancy;

namespace CrystalPharm.Api.Tenancy;

/// <summary>Le Tenant de la requête, posé une seule fois par <see cref="TenantResolutionMiddleware"/>.</summary>
public sealed class RequestTenantContext : ITenantContext
{
    private Guid? _tenantId;
    private string? _callerId;

    public bool IsResolved => _tenantId is not null;

    public Guid TenantId => _tenantId ?? throw new InvalidOperationException("No tenant is resolved for this request.");

    public string CallerId => _callerId ?? throw new InvalidOperationException("No caller is resolved for this request.");

    public void Resolve(Guid tenantId, string callerId)
    {
        if (IsResolved)
        {
            throw new InvalidOperationException("The tenant of a request is resolved only once.");
        }

        _tenantId = tenantId;
        _callerId = callerId;
    }
}

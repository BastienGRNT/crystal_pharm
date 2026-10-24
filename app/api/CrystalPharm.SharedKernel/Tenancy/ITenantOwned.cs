namespace CrystalPharm.SharedKernel.Tenancy;

/// <summary>
/// Une donnée qui appartient à un seul Tenant. Son <see cref="TenantId"/> est posé à
/// l'enregistrement depuis <see cref="ITenantContext"/>, jamais à la main.
/// </summary>
public interface ITenantOwned
{
    Guid TenantId { get; }
}

using CrystalPharm.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace CrystalPharm.Booking.Infrastructure.Persistence.Interceptors;

/// <summary>
/// Pose le Tenant de la requête sur chaque donnée ajoutée, et refuse toute
/// modification ou suppression d'une donnée d'un autre Tenant.
/// </summary>
internal sealed class TenantOwnershipInterceptor(ITenantContext tenantContext) : SaveChangesInterceptor
{
    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        StampTenantOwnership(eventData.Context);
        return result;
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        StampTenantOwnership(eventData.Context);
        return ValueTask.FromResult(result);
    }

    private void StampTenantOwnership(DbContext? context)
    {
        if (context is null)
        {
            return;
        }

        foreach (var entry in context.ChangeTracker.Entries<ITenantOwned>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    TenantIdOf(entry).CurrentValue = tenantContext.TenantId;
                    break;
                case EntityState.Modified or EntityState.Deleted when !Equals(TenantIdOf(entry).OriginalValue, tenantContext.TenantId):
                    throw new InvalidOperationException("A tenant-owned entity cannot be written for another tenant.");
            }
        }
    }

    private static PropertyEntry TenantIdOf(EntityEntry<ITenantOwned> entry) => entry.Property(nameof(ITenantOwned.TenantId));
}

using CrystalPharm.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;

namespace CrystalPharm.SharedKernel.Persistence.Tenancy;

/// <summary>
/// Le contexte EF d'un module dont les données appartiennent à un Tenant : chaque écriture passe par une
/// transaction, et chaque entité déclarée par <see cref="FilterByCurrentTenant{TEntity}"/> n'est lue que
/// pour le Tenant de la requête.
/// </summary>
public abstract class TenantScopedDbContext : DbContext
{
    private readonly ITenantContext tenantContext;

    protected TenantScopedDbContext(DbContextOptions options, ITenantContext tenantContext)
        : base(options)
    {
        this.tenantContext = tenantContext;
        // Sans cela, EF Core enregistre une seule modification hors transaction : la
        // Row-Level Security ne connaîtrait pas le Tenant (cf. TenantTransactionInterceptor).
        Database.AutoTransactionBehavior = AutoTransactionBehavior.Always;
    }

    // Lu par les query filters à chaque requête : EF Core le relit sur cette instance du contexte.
    private Guid CurrentTenantId => tenantContext.TenantId;

    protected void FilterByCurrentTenant<TEntity>(ModelBuilder modelBuilder)
        where TEntity : class, ITenantOwned
    {
        modelBuilder.Entity<TEntity>().HasQueryFilter(entity => entity.TenantId == CurrentTenantId);
    }

    /// <summary>
    /// Une lecture seule ne crée pas de transaction : on en ouvre une pour que la
    /// Row-Level Security connaisse le Tenant (cf. <see cref="TenantTransactionInterceptor"/>).
    /// </summary>
    public async Task<TResult> ReadInTenantTransactionAsync<TResult>(
        Func<Task<TResult>> read,
        CancellationToken cancellationToken)
    {
        await using var transaction = await Database.BeginTransactionAsync(cancellationToken);
        var result = await read();
        await transaction.CommitAsync(cancellationToken);
        return result;
    }
}

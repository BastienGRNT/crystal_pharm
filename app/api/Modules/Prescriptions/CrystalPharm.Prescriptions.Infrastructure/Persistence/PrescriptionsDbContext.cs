using CrystalPharm.Prescriptions.Domain.Entities;
using CrystalPharm.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;

namespace CrystalPharm.Prescriptions.Infrastructure.Persistence;

internal sealed class PrescriptionsDbContext : DbContext
{
    public const string SchemaName = "prescriptions";

    private readonly ITenantContext tenantContext;

    public PrescriptionsDbContext(DbContextOptions<PrescriptionsDbContext> options, ITenantContext tenantContext)
        : base(options)
    {
        this.tenantContext = tenantContext;
        // Sans cela, EF Core enregistre une seule modification hors transaction : la
        // Row-Level Security ne connaîtrait pas le Tenant (cf. TenantTransactionInterceptor).
        Database.AutoTransactionBehavior = AutoTransactionBehavior.Always;
    }

    public DbSet<PrescriptionSubmission> Submissions => Set<PrescriptionSubmission>();
    public DbSet<SubmittedDocument> Documents => Set<SubmittedDocument>();
    public DbSet<PrescriptionAccessRecord> AccessRecords => Set<PrescriptionAccessRecord>();

    // Lu par les query filters à chaque requête : EF Core le relit sur cette instance du contexte.
    private Guid CurrentTenantId => tenantContext.TenantId;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(SchemaName);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(PrescriptionsDbContext).Assembly);
        FilterByCurrentTenant<PrescriptionSubmission>(modelBuilder);
        FilterByCurrentTenant<SubmittedDocument>(modelBuilder);
        FilterByCurrentTenant<PrescriptionAccessRecord>(modelBuilder);
    }

    private void FilterByCurrentTenant<TEntity>(ModelBuilder modelBuilder)
        where TEntity : class, ITenantOwned
    {
        modelBuilder.Entity<TEntity>().HasQueryFilter(entity => entity.TenantId == CurrentTenantId);
    }
}

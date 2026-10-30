using CrystalPharm.Prescriptions.Domain.Entities;
using CrystalPharm.SharedKernel.Persistence.Tenancy;
using CrystalPharm.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;

namespace CrystalPharm.Prescriptions.Infrastructure.Persistence;

internal sealed class PrescriptionsDbContext(DbContextOptions<PrescriptionsDbContext> options, ITenantContext tenantContext)
    : TenantScopedDbContext(options, tenantContext)
{
    public const string SchemaName = "prescriptions";

    public DbSet<PrescriptionSubmission> Submissions => Set<PrescriptionSubmission>();
    public DbSet<SubmittedDocument> Documents => Set<SubmittedDocument>();
    public DbSet<PrescriptionAccessRecord> AccessRecords => Set<PrescriptionAccessRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(SchemaName);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(PrescriptionsDbContext).Assembly);
        FilterByCurrentTenant<PrescriptionSubmission>(modelBuilder);
        FilterByCurrentTenant<SubmittedDocument>(modelBuilder);
        FilterByCurrentTenant<PrescriptionAccessRecord>(modelBuilder);
    }
}

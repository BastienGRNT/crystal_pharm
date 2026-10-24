using CrystalPharm.Booking.Domain.Entities;
using CrystalPharm.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;

namespace CrystalPharm.Booking.Infrastructure.Persistence;

internal sealed class BookingDbContext : DbContext
{
    public const string SchemaName = "booking";

    private readonly ITenantContext tenantContext;

    public BookingDbContext(DbContextOptions<BookingDbContext> options, ITenantContext tenantContext)
        : base(options)
    {
        this.tenantContext = tenantContext;
        // Sans cela, EF Core enregistre une seule modification hors transaction : la
        // Row-Level Security ne connaîtrait pas le Tenant (cf. TenantTransactionInterceptor).
        Database.AutoTransactionBehavior = AutoTransactionBehavior.Always;
    }

    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<HealthDataAccessRecord> HealthDataAccessRecords => Set<HealthDataAccessRecord>();

    // Lu par les query filters à chaque requête : EF Core le relit sur cette instance du contexte.
    private Guid CurrentTenantId => tenantContext.TenantId;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(SchemaName);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(BookingDbContext).Assembly);
        FilterByCurrentTenant<Appointment>(modelBuilder);
        FilterByCurrentTenant<HealthDataAccessRecord>(modelBuilder);
    }

    private void FilterByCurrentTenant<TEntity>(ModelBuilder modelBuilder)
        where TEntity : class, ITenantOwned
    {
        modelBuilder.Entity<TEntity>().HasQueryFilter(entity => entity.TenantId == CurrentTenantId);
    }
}

using CrystalPharm.Booking.Domain.Entities;
using CrystalPharm.SharedKernel.Persistence.Tenancy;
using CrystalPharm.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;

namespace CrystalPharm.Booking.Infrastructure.Persistence;

internal sealed class BookingDbContext(DbContextOptions<BookingDbContext> options, ITenantContext tenantContext)
    : TenantScopedDbContext(options, tenantContext)
{
    public const string SchemaName = "booking";

    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<StoredAppointmentConfiguration> AppointmentConfigurations => Set<StoredAppointmentConfiguration>();
    public DbSet<HealthDataAccessRecord> HealthDataAccessRecords => Set<HealthDataAccessRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(SchemaName);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(BookingDbContext).Assembly);
        FilterByCurrentTenant<Appointment>(modelBuilder);
        FilterByCurrentTenant<StoredAppointmentConfiguration>(modelBuilder);
        FilterByCurrentTenant<HealthDataAccessRecord>(modelBuilder);
    }
}

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CrystalPharm.Booking.Infrastructure.Persistence.Configurations;

internal sealed class HealthDataAccessRecordConfiguration : IEntityTypeConfiguration<HealthDataAccessRecord>
{
    public void Configure(EntityTypeBuilder<HealthDataAccessRecord> builder)
    {
        builder.ToTable("health_data_access_records");
        builder.HasKey(record => record.Id);
        builder.Property(record => record.Id).ValueGeneratedNever();
        builder.HasIndex(record => new { record.TenantId, record.AccessedAt });
    }
}

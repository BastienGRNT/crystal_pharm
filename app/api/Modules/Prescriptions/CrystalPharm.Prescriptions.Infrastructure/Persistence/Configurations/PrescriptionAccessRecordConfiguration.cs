using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CrystalPharm.Prescriptions.Infrastructure.Persistence.Configurations;

internal sealed class PrescriptionAccessRecordConfiguration : IEntityTypeConfiguration<PrescriptionAccessRecord>
{
    public void Configure(EntityTypeBuilder<PrescriptionAccessRecord> builder)
    {
        builder.ToTable("access_records");
        builder.HasKey(record => record.Id);
        builder.Property(record => record.Id).ValueGeneratedNever();
        builder.HasIndex(record => new { record.TenantId, record.AccessedAt });
    }
}

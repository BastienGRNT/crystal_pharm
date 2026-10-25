using CrystalPharm.Prescriptions.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CrystalPharm.Prescriptions.Infrastructure.Persistence.Configurations;

internal sealed class SubmittedDocumentConfiguration : IEntityTypeConfiguration<SubmittedDocument>
{
    public void Configure(EntityTypeBuilder<SubmittedDocument> builder)
    {
        builder.ToTable("documents");
        builder.HasKey(document => document.Id);
        builder.Property(document => document.Id).ValueGeneratedNever();
        builder.Property(document => document.Kind).HasConversion<string>().HasMaxLength(30);
        builder.Property(document => document.Format).HasConversion<string>().HasMaxLength(10);
        builder.Ignore(document => document.StorageKey);
        builder.HasIndex(document => new { document.TenantId, document.SubmissionId });
    }
}

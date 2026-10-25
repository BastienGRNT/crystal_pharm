using CrystalPharm.Prescriptions.Domain.Entities;
using CrystalPharm.Prescriptions.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CrystalPharm.Prescriptions.Infrastructure.Persistence.Configurations;

internal sealed class PrescriptionSubmissionConfiguration : IEntityTypeConfiguration<PrescriptionSubmission>
{
    public void Configure(EntityTypeBuilder<PrescriptionSubmission> builder)
    {
        builder.ToTable("submissions");
        builder.HasKey(submission => submission.Id);
        builder.Property(submission => submission.Id).ValueGeneratedNever();
        // Une heure murale de la pharmacie, sans fuseau.
        builder.Property(submission => submission.PlannedVisitAt).HasColumnType("timestamp without time zone");
        builder.Property(submission => submission.IdempotencyKey).HasMaxLength(PrescriptionSubmission.MaximumIdempotencyKeyLength);
        builder.Property(submission => submission.FirstName).HasMaxLength(PatientIdentity.MaximumNameLength);
        builder.Property(submission => submission.LastName).HasMaxLength(PatientIdentity.MaximumNameLength);
        builder.Property(submission => submission.Phone).HasMaxLength(PatientIdentity.MaximumPhoneLength);
        builder.Property(submission => submission.SocialSecurityNumber).HasMaxLength(SocialSecurityNumber.Length);
        builder.HasMany(submission => submission.Documents)
            .WithOne()
            .HasForeignKey(document => document.SubmissionId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(submission => submission.Documents).UsePropertyAccessMode(PropertyAccessMode.Field);
        builder.HasIndex(submission => new { submission.TenantId, submission.IdempotencyKey }).IsUnique();
        builder.HasIndex(submission => new { submission.TenantId, submission.PlannedVisitAt });
    }
}

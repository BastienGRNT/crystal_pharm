using CrystalPharm.Booking.Domain.Entities;
using CrystalPharm.Booking.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CrystalPharm.Booking.Infrastructure.Persistence.Configurations;

internal sealed class AppointmentConfiguration : IEntityTypeConfiguration<Appointment>
{
    public void Configure(EntityTypeBuilder<Appointment> builder)
    {
        builder.ToTable("appointments");
        builder.HasKey(appointment => appointment.Id);
        builder.Property(appointment => appointment.Id).ValueGeneratedNever();
        builder.Property(appointment => appointment.PatientName).HasMaxLength(PatientContact.MaximumNameLength);
        builder.Property(appointment => appointment.PatientPhone).HasMaxLength(PatientContact.MaximumPhoneLength);
        builder.Property(appointment => appointment.Reason).HasMaxLength(Appointment.MaximumReasonLength);
        builder.Property(appointment => appointment.Note).HasMaxLength(Appointment.MaximumNoteLength);
        builder.Property(appointment => appointment.Status)
            .HasConversion(
                status => status.ToString().ToLowerInvariant(),
                storedStatus => Enum.Parse<AppointmentStatus>(storedStatus, true));
        builder.HasIndex(appointment => new { appointment.TenantId, appointment.Day });
    }
}

using System.Text.Json;
using DomainAppointmentConfiguration = CrystalPharm.Booking.Domain.Configuration.AppointmentConfiguration;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CrystalPharm.Booking.Infrastructure.Persistence.Configurations;

internal sealed class StoredAppointmentConfigurationConfiguration : IEntityTypeConfiguration<StoredAppointmentConfiguration>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public void Configure(EntityTypeBuilder<StoredAppointmentConfiguration> builder)
    {
        builder.ToTable("appointment_configurations");
        builder.HasKey(stored => stored.Id);
        builder.Property(stored => stored.Id).ValueGeneratedNever();
        builder.HasIndex(stored => stored.TenantId).IsUnique();
        builder.Property(stored => stored.Configuration)
            .HasColumnType("jsonb")
            .HasConversion(
                configuration => JsonSerializer.Serialize(configuration, JsonOptions),
                json => JsonSerializer.Deserialize<DomainAppointmentConfiguration>(json, JsonOptions)!,
                new ValueComparer<DomainAppointmentConfiguration>(
                    (first, second) => JsonSerializer.Serialize(first, JsonOptions) == JsonSerializer.Serialize(second, JsonOptions),
                    configuration => JsonSerializer.Serialize(configuration, JsonOptions).GetHashCode(),
                    configuration => JsonSerializer.Deserialize<DomainAppointmentConfiguration>(JsonSerializer.Serialize(configuration, JsonOptions), JsonOptions)!));
    }
}

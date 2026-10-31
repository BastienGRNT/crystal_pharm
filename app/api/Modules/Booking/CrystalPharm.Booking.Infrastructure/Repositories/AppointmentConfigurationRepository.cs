using CrystalPharm.Booking.Application.Interfaces;
using CrystalPharm.Booking.Domain.Configuration;
using CrystalPharm.Booking.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CrystalPharm.Booking.Infrastructure.Repositories;

internal sealed class AppointmentConfigurationRepository(BookingDbContext context, TimeProvider timeProvider) : IAppointmentConfigurationRepository
{
    public async Task<AppointmentConfiguration> GetAsync(CancellationToken cancellationToken)
    {
        var stored = await context.ReadInTenantTransactionAsync(
            () => context.AppointmentConfigurations.AsNoTracking().SingleOrDefaultAsync(cancellationToken),
            cancellationToken);
        return stored?.Configuration ?? AppointmentConfiguration.Default;
    }

    public async Task SaveAsync(AppointmentConfiguration configuration, CancellationToken cancellationToken)
    {
        var stored = await context.ReadInTenantTransactionAsync(
            () => context.AppointmentConfigurations.SingleOrDefaultAsync(cancellationToken),
            cancellationToken);
        if (stored is null)
        {
            stored = new StoredAppointmentConfiguration();
            context.AppointmentConfigurations.Add(stored);
        }

        stored.Configuration = configuration;
        stored.UpdatedAt = timeProvider.GetUtcNow();
        await context.SaveChangesAsync(cancellationToken);
    }
}

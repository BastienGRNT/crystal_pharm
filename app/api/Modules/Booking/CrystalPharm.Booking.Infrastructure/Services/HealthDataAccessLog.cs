using CrystalPharm.Booking.Application.Interfaces;
using CrystalPharm.Booking.Infrastructure.Persistence;
using CrystalPharm.SharedKernel.Tenancy;

namespace CrystalPharm.Booking.Infrastructure.Services;

internal sealed class HealthDataAccessLog(BookingDbContext context, ITenantContext tenantContext, TimeProvider timeProvider)
    : IHealthDataAccessLog
{
    public async Task RecordAsync(string action, IReadOnlyCollection<Guid> appointmentIds, CancellationToken cancellationToken)
    {
        context.HealthDataAccessRecords.Add(
            new HealthDataAccessRecord(tenantContext.CallerId, action, appointmentIds.ToArray(), timeProvider.GetUtcNow()));
        await context.SaveChangesAsync(cancellationToken);
    }
}

using CrystalPharm.Prescriptions.Application.Interfaces;
using CrystalPharm.Prescriptions.Infrastructure.Persistence;
using CrystalPharm.SharedKernel.Tenancy;

namespace CrystalPharm.Prescriptions.Infrastructure.Services;

internal sealed class PrescriptionAccessLog(PrescriptionsDbContext context, ITenantContext tenantContext, TimeProvider timeProvider)
    : IPrescriptionAccessLog
{
    public async Task RecordAsync(string action, IReadOnlyCollection<Guid> submissionIds, CancellationToken cancellationToken)
    {
        context.AccessRecords.Add(
            new PrescriptionAccessRecord(tenantContext.CallerId, action, submissionIds.ToArray(), timeProvider.GetUtcNow()));
        await context.SaveChangesAsync(cancellationToken);
    }
}

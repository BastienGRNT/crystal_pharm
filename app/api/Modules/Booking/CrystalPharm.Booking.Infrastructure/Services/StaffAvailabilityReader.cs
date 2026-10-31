using CrystalPharm.Booking.Application.Interfaces;
using CrystalPharm.Booking.Domain.Scheduling;
using CrystalPharm.SharedKernel.Tenancy;
using Npgsql;

namespace CrystalPharm.Booking.Infrastructure.Services;

/// <summary>
/// Lit <c>planning.staff_availability</c> (colonnes du contrat : <c>tenant_id</c>, <c>employee_id</c>, <c>day</c>,
/// <c>start_time</c>, <c>end_time</c>) par une connexion en lecture seule. Le Tenant vient du contexte de la requête.
/// </summary>
internal sealed class StaffAvailabilityReader(NpgsqlDataSource planningDataSource, ITenantContext tenantContext) : IStaffAvailabilityReader
{
    private const string Query = """
        select employee_id, day, start_time, end_time
        from planning.staff_availability
        where tenant_id = @tenantId and day between @firstDay and @lastDay
        order by day, start_time
        """;

    public async Task<IReadOnlyList<AvailabilityWindow>> ListOfPeriodAsync(DateOnly firstDay, DateOnly lastDay, CancellationToken cancellationToken)
    {
        await using var command = planningDataSource.CreateCommand(Query);
        command.Parameters.AddWithValue("tenantId", tenantContext.TenantId);
        command.Parameters.AddWithValue("firstDay", firstDay);
        command.Parameters.AddWithValue("lastDay", lastDay);

        var windows = new List<AvailabilityWindow>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            windows.Add(new AvailabilityWindow(
                reader.GetGuid(0),
                DateOnly.FromDateTime(reader.GetDateTime(1)),
                TimeOnly.FromTimeSpan(reader.GetTimeSpan(2)),
                TimeOnly.FromTimeSpan(reader.GetTimeSpan(3))));
        }

        return windows;
    }
}

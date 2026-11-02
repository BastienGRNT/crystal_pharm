using CrystalPharm.Booking.Application.Interfaces;
using CrystalPharm.Booking.Domain.Scheduling;

namespace CrystalPharm.Booking.Infrastructure.Services;

/// <summary>Sans <c>ConnectionStrings__PlanningReadOnly</c>, le planning n'ajoute aucune plage : seuls les horaires réglés dans <c>booking</c> comptent.</summary>
internal sealed class NoStaffAvailabilityReader : IStaffAvailabilityReader
{
    public Task<IReadOnlyList<AvailabilityWindow>> ListOfPeriodAsync(DateOnly firstDay, DateOnly lastDay, CancellationToken cancellationToken) =>
        Task.FromResult<IReadOnlyList<AvailabilityWindow>>([]);
}

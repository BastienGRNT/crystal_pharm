using CrystalPharm.Booking.Application.Dtos;
using CrystalPharm.Booking.Application.Interfaces;

namespace CrystalPharm.Booking.Infrastructure.Services;

/// <summary>Sans <c>ConnectionStrings__PlanningReadOnly</c>, aucune disponibilité : le site n'affiche alors aucun créneau.</summary>
internal sealed class NoStaffAvailabilityReader : IStaffAvailabilityReader
{
    public Task<IReadOnlyList<StaffAvailabilityWindow>> ListOfDayAsync(DateOnly day, CancellationToken cancellationToken) =>
        Task.FromResult<IReadOnlyList<StaffAvailabilityWindow>>([]);
}

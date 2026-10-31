using CrystalPharm.Booking.Domain.Scheduling;

namespace CrystalPharm.Booking.Application.Interfaces;

/// <summary>La disponibilité de l'équipe du Tenant de la requête, lue (jamais écrite) dans <c>planning.staff_availability</c>.</summary>
public interface IStaffAvailabilityReader
{
    Task<IReadOnlyList<AvailabilityWindow>> ListOfPeriodAsync(DateOnly firstDay, DateOnly lastDay, CancellationToken cancellationToken);
}

using CrystalPharm.Booking.Application.Dtos;

namespace CrystalPharm.Booking.Application.Interfaces;

/// <summary>La disponibilité de l'équipe du Tenant de la requête, lue (jamais écrite) dans <c>planning.staff_availability</c>.</summary>
public interface IStaffAvailabilityReader
{
    Task<IReadOnlyList<StaffAvailabilityWindow>> ListOfDayAsync(DateOnly day, CancellationToken cancellationToken);
}

using CrystalPharm.Booking.Application.Dtos;

namespace CrystalPharm.Booking.Application.Interfaces;

public interface IAppointmentConfigurationService
{
    Task<AppointmentConfigurationDto> GetAsync(CancellationToken cancellationToken);

    /// <exception cref="Domain.InvalidAppointmentException">Quand une règle de la configuration n'est pas respectée.</exception>
    Task<AppointmentConfigurationDto> ReplaceAsync(AppointmentConfigurationDto configuration, CancellationToken cancellationToken);
}

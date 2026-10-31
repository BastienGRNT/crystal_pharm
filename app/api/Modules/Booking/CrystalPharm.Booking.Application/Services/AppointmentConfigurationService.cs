using CrystalPharm.Booking.Application.Dtos;
using CrystalPharm.Booking.Application.Interfaces;

namespace CrystalPharm.Booking.Application.Services;

public sealed class AppointmentConfigurationService(IAppointmentConfigurationRepository configurationRepository) : IAppointmentConfigurationService
{
    public async Task<AppointmentConfigurationDto> GetAsync(CancellationToken cancellationToken) =>
        AppointmentConfigurationDto.From(await configurationRepository.GetAsync(cancellationToken));

    public async Task<AppointmentConfigurationDto> ReplaceAsync(AppointmentConfigurationDto configuration, CancellationToken cancellationToken)
    {
        var validated = configuration.ToDomain();
        await configurationRepository.SaveAsync(validated, cancellationToken);
        return AppointmentConfigurationDto.From(validated);
    }
}

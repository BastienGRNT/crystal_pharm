using CrystalPharm.Booking.Domain.Configuration;

namespace CrystalPharm.Booking.Application.Interfaces;

/// <summary>La configuration des rendez-vous du Tenant de la requête : jamais celle d'un autre.</summary>
public interface IAppointmentConfigurationRepository
{
    /// <returns>La configuration enregistrée, ou celle par défaut tant que la pharmacie n'a rien réglé.</returns>
    Task<AppointmentConfiguration> GetAsync(CancellationToken cancellationToken);

    Task SaveAsync(AppointmentConfiguration configuration, CancellationToken cancellationToken);
}

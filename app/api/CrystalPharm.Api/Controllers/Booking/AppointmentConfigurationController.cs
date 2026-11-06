using CrystalPharm.Api.Authentication;
using CrystalPharm.Booking.Application.Dtos;
using CrystalPharm.Booking.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrystalPharm.Api.Controllers.Booking;

/// <summary>Les motifs, horaires et règles de rendez-vous de la pharmacie du Manager connecté.</summary>
[ApiController]
[Route("booking/configuration")]
[Authorize(Policy = ManagerAuthentication.PolicyName)]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class AppointmentConfigurationController(IAppointmentConfigurationService configurationService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<AppointmentConfigurationDto>(StatusCodes.Status200OK)]
    public async Task<ActionResult<AppointmentConfigurationDto>> Get(CancellationToken cancellationToken) =>
        Ok(await configurationService.GetAsync(cancellationToken));

    /// <summary>Remplace toute la configuration ; 400 si une règle n'est pas respectée.</summary>
    [HttpPut]
    [ProducesResponseType<AppointmentConfigurationDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AppointmentConfigurationDto>> Replace(
        AppointmentConfigurationDto configuration,
        CancellationToken cancellationToken) =>
        Ok(await configurationService.ReplaceAsync(configuration, cancellationToken));
}

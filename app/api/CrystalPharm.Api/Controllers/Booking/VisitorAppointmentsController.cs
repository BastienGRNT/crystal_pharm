using System.Globalization;
using CrystalPharm.Api.Authentication;
using CrystalPharm.Api.Tenancy;
using CrystalPharm.Booking.Application.Dtos;
using CrystalPharm.Booking.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace CrystalPharm.Api.Controllers.Booking;

/// <summary>Les rendez-vous demandés depuis le site d'une pharmacie, reçus par le service <c>site</c>.</summary>
[ApiController]
[Route("visitor/appointments")]
[Authorize(Policy = SiteServiceAuthentication.PolicyName)]
[EnableRateLimiting(AppointmentRateLimiting.PolicyName)]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class VisitorAppointmentsController(IVisitorAppointmentService visitorAppointmentService) : ControllerBase
{
    /// <summary>Les créneaux libres d'un jour (<c>?day=2026-10-19</c>).</summary>
    [HttpGet("slots")]
    [ProducesResponseType<IReadOnlyList<AvailableAppointmentSlotDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<IReadOnlyList<AvailableAppointmentSlotDto>>> ListAvailableSlots(
        [FromQuery] string? day,
        CancellationToken cancellationToken)
    {
        if (!DateOnly.TryParseExact(day, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedDay))
        {
            return Problem(title: "Jour invalide", detail: "Le jour attendu a le format 2026-10-19.", statusCode: StatusCodes.Status400BadRequest);
        }

        return Ok(await visitorAppointmentService.ListAvailableSlotsAsync(parsedDay, cancellationToken));
    }

    /// <summary>Demande le rendez-vous d'un créneau : refusé (409) s'il n'est plus libre.</summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> RequestAppointment(VisitorAppointmentRequestDto request, CancellationToken cancellationToken)
    {
        var result = await visitorAppointmentService.RequestAsync(request, cancellationToken);
        return result switch
        {
            VisitorAppointmentResult.Requested => StatusCode(StatusCodes.Status201Created),
            VisitorAppointmentResult.SlotUnavailable => Problem(
                title: "Créneau indisponible",
                detail: "Ce créneau n’est plus disponible.",
                statusCode: StatusCodes.Status409Conflict),
            _ => throw new InvalidOperationException("Unknown visitor appointment result."),
        };
    }
}

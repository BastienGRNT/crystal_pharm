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
    /// <summary>Les motifs proposés par la pharmacie et ses règles de réservation.</summary>
    [HttpGet("options")]
    [ProducesResponseType<VisitorAppointmentOptionsDto>(StatusCodes.Status200OK)]
    public async Task<ActionResult<VisitorAppointmentOptionsDto>> GetOptions(CancellationToken cancellationToken) =>
        Ok(await visitorAppointmentService.GetOptionsAsync(cancellationToken));

    /// <summary>Les jours où il reste un créneau pour un motif (<c>?reasonId=…&amp;from=2026-10-01&amp;to=2026-10-31</c>).</summary>
    [HttpGet("availability")]
    [ProducesResponseType<IReadOnlyList<AvailableAppointmentDayDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<IReadOnlyList<AvailableAppointmentDayDto>>> ListAvailableDays(
        [FromQuery] Guid reasonId,
        [FromQuery] string? from,
        [FromQuery] string? to,
        CancellationToken cancellationToken)
    {
        if (!TryParseDay(from, out var firstDay) || !TryParseDay(to, out var lastDay)
            || lastDay < firstDay || lastDay.DayNumber - firstDay.DayNumber >= IVisitorAppointmentService.MaximumDaysPerAvailabilityListing)
        {
            return Problem(
                title: "Période invalide",
                detail: $"La période attendue a le format 2026-10-01 et couvre {IVisitorAppointmentService.MaximumDaysPerAvailabilityListing} jours au plus.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        return Ok(await visitorAppointmentService.ListAvailableDaysAsync(reasonId, firstDay, lastDay, cancellationToken));
    }

    /// <summary>Les créneaux libres d'un jour pour un motif (<c>?reasonId=…&amp;day=2026-10-19</c>).</summary>
    [HttpGet("slots")]
    [ProducesResponseType<IReadOnlyList<AvailableAppointmentSlotDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<IReadOnlyList<AvailableAppointmentSlotDto>>> ListAvailableSlots(
        [FromQuery] Guid reasonId,
        [FromQuery] string? day,
        CancellationToken cancellationToken)
    {
        if (!TryParseDay(day, out var parsedDay))
        {
            return Problem(title: "Jour invalide", detail: "Le jour attendu a le format 2026-10-19.", statusCode: StatusCodes.Status400BadRequest);
        }

        return Ok(await visitorAppointmentService.ListAvailableSlotsAsync(reasonId, parsedDay, cancellationToken));
    }

    /// <summary>Demande le rendez-vous d'un créneau : refusé (409) s'il n'est plus libre.</summary>
    [HttpPost]
    [ProducesResponseType<VisitorAppointmentConfirmationDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<VisitorAppointmentConfirmationDto>> RequestAppointment(
        VisitorAppointmentRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await visitorAppointmentService.RequestAsync(request, cancellationToken);
        return result switch
        {
            VisitorAppointmentResult.Requested requested => StatusCode(StatusCodes.Status201Created, requested.Confirmation),
            VisitorAppointmentResult.SlotUnavailable => Problem(
                title: "Créneau indisponible",
                detail: "Ce créneau n’est plus disponible.",
                statusCode: StatusCodes.Status409Conflict),
            VisitorAppointmentResult.ReasonUnavailable => Problem(
                title: "Motif indisponible",
                detail: "Ce motif n’est plus proposé.",
                statusCode: StatusCodes.Status400BadRequest),
            _ => throw new InvalidOperationException("Unknown visitor appointment result."),
        };
    }

    private static bool TryParseDay(string? text, out DateOnly day) =>
        DateOnly.TryParseExact(text, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out day);
}

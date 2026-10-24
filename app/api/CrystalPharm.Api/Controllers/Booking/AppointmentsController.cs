using CrystalPharm.Api.Authentication;
using CrystalPharm.Booking.Application.Dtos;
using CrystalPharm.Booking.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrystalPharm.Api.Controllers.Booking;

/// <summary>Les rendez-vous de la pharmacie du Manager connecté.</summary>
[ApiController]
[Route("booking/appointments")]
[Authorize(Policy = ManagerAuthentication.PolicyName)]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class AppointmentsController(IAppointmentService appointmentService) : ControllerBase
{
    /// <summary>Les rendez-vous des jours demandés (<c>?day=2026-10-19&amp;day=2026-10-20</c>), dans l'ordre de la journée.</summary>
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<AppointmentDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<IReadOnlyList<AppointmentDto>>> ListOfDays(
        [FromQuery(Name = "day")] DateOnly[] days,
        CancellationToken cancellationToken)
    {
        var distinctDays = days.Distinct().ToArray();
        if (distinctDays.Length is 0 or > IAppointmentService.MaximumDaysPerListing)
        {
            return Problem(
                title: "Jours demandés invalides",
                detail: $"Demandez entre 1 et {IAppointmentService.MaximumDaysPerListing} jours.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        return Ok(await appointmentService.ListOfDaysAsync(distinctDays, cancellationToken));
    }

    [HttpGet("{appointmentId:guid}")]
    [ProducesResponseType<AppointmentDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AppointmentDto>> Find(Guid appointmentId, CancellationToken cancellationToken)
    {
        var appointment = await appointmentService.FindAsync(appointmentId, cancellationToken);
        return appointment is null ? NotFound() : Ok(appointment);
    }

    /// <summary>Un nouveau rendez-vous, en attente : refusé (409) si l'Employee est déjà pris sur ce créneau.</summary>
    [HttpPost]
    [ProducesResponseType<AppointmentDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AppointmentDto>> Schedule(
        NewAppointmentDto newAppointment,
        CancellationToken cancellationToken)
    {
        var schedulingResult = await appointmentService.ScheduleAsync(newAppointment, cancellationToken);
        return schedulingResult switch
        {
            AppointmentSchedulingResult.Scheduled scheduled =>
                CreatedAtAction(nameof(Find), new { appointmentId = scheduled.Appointment.Id }, scheduled.Appointment),
            AppointmentSchedulingResult.SlotAlreadyTaken => Problem(
                title: "Créneau déjà pris",
                detail: "Cette personne de l’équipe a déjà un rendez-vous sur ce créneau.",
                statusCode: StatusCodes.Status409Conflict),
            _ => throw new InvalidOperationException("Unknown scheduling result."),
        };
    }

    /// <summary>Confirme un rendez-vous en attente ; 409 s'il n'existe pas ou n'est plus en attente.</summary>
    [HttpPost("{appointmentId:guid}/confirm")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Confirm(Guid appointmentId, CancellationToken cancellationToken) =>
        await appointmentService.ConfirmAsync(appointmentId, cancellationToken)
            ? NoContent()
            : Problem(title: "Rendez-vous non confirmé", detail: "Ce rendez-vous n’est plus en attente.", statusCode: StatusCodes.Status409Conflict);

    /// <summary>Annule un rendez-vous ; 409 s'il n'existe pas ou est déjà annulé.</summary>
    [HttpPost("{appointmentId:guid}/cancel")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Cancel(Guid appointmentId, CancellationToken cancellationToken) =>
        await appointmentService.CancelAsync(appointmentId, cancellationToken)
            ? NoContent()
            : Problem(title: "Rendez-vous non annulé", detail: "Ce rendez-vous est déjà annulé.", statusCode: StatusCodes.Status409Conflict);
}

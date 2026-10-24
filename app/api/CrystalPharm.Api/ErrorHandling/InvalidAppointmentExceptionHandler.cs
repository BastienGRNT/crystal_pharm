using CrystalPharm.Booking.Domain;
using Microsoft.AspNetCore.Diagnostics;

namespace CrystalPharm.Api.ErrorHandling;

/// <summary>Une règle du rendez-vous refusée : 400, avec son message fixe (jamais la saisie reçue).</summary>
public sealed class InvalidAppointmentExceptionHandler(IProblemDetailsService problemDetailsService) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        if (exception is not InvalidAppointmentException invalidAppointment)
        {
            return false;
        }

        httpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
        return await problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails = { Title = "Rendez-vous refusé", Detail = invalidAppointment.Message },
        });
    }
}

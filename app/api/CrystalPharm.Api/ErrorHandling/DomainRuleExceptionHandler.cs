using CrystalPharm.Booking.Domain;
using CrystalPharm.Prescriptions.Domain;
using Microsoft.AspNetCore.Diagnostics;

namespace CrystalPharm.Api.ErrorHandling;

/// <summary>Une règle du domaine refusée : 400, avec son message fixe (jamais la saisie reçue).</summary>
public sealed class DomainRuleExceptionHandler(IProblemDetailsService problemDetailsService) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var title = exception switch
        {
            InvalidAppointmentException => "Rendez-vous refusé",
            InvalidPrescriptionException => "Envoi refusé",
            _ => null,
        };
        if (title is null)
        {
            return false;
        }

        httpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
        return await problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails = { Title = title, Detail = exception.Message },
        });
    }
}

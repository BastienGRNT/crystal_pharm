using CrystalPharm.Prescriptions.Domain;
using Microsoft.AspNetCore.Diagnostics;

namespace CrystalPharm.Api.ErrorHandling;

/// <summary>Un envoi d'ordonnance refusé par une règle : 400, avec son message fixe (jamais la saisie reçue).</summary>
public sealed class InvalidPrescriptionExceptionHandler(IProblemDetailsService problemDetailsService) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        if (exception is not InvalidPrescriptionException invalidPrescription)
        {
            return false;
        }

        httpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
        return await problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails = { Title = "Envoi refusé", Detail = invalidPrescription.Message },
        });
    }
}

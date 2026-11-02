using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace CrystalPharm.Api.Controllers.Development;

/// <summary>Hors développement, l'endpoint répond comme s'il n'existait pas.</summary>
[AttributeUsage(AttributeTargets.Class)]
public sealed class DevelopmentOnlyAttribute : Attribute, IResourceFilter
{
    public void OnResourceExecuting(ResourceExecutingContext context)
    {
        var environment = context.HttpContext.RequestServices.GetRequiredService<IHostEnvironment>();
        if (!environment.IsDevelopment())
        {
            context.Result = new NotFoundResult();
        }
    }

    public void OnResourceExecuted(ResourceExecutedContext context)
    {
    }
}

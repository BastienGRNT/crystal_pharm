using CrystalPharm.Api.Authentication;

namespace CrystalPharm.Api.Tenancy;

/// <summary>
/// Remplit le contexte du Tenant depuis le JWT vérifié d'un Manager, jamais depuis un
/// en-tête, un paramètre ou le corps de la requête.
/// </summary>
public sealed class TenantResolutionMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext httpContext, RequestTenantContext tenantContext)
    {
        if (ManagerClaims.TryRead(httpContext.User, out var tenantId, out var accountId))
        {
            tenantContext.Resolve(tenantId, accountId);
        }

        await next(httpContext);
    }
}

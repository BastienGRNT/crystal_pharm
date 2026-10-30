using CrystalPharm.Api.Authentication;
using Microsoft.AspNetCore.Authentication;

namespace CrystalPharm.Api.Tenancy;

/// <summary>
/// Remplit le contexte du Tenant depuis le JWT vérifié d'un Manager ou l'identité de service de
/// <c>site</c>, jamais depuis un paramètre ou le corps de la requête. Deux identités à la fois : 400.
/// </summary>
public sealed class TenantResolutionMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext httpContext, RequestTenantContext tenantContext)
    {
        var presentsSiteServiceKey = httpContext.Request.Headers.ContainsKey(SiteServiceAuthentication.ServiceKeyHeader);

        if (ManagerClaims.TryRead(httpContext.User, out var managerTenantId, out var accountId))
        {
            if (presentsSiteServiceKey)
            {
                httpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
                return;
            }

            tenantContext.Resolve(managerTenantId, accountId);
        }
        else if (presentsSiteServiceKey)
        {
            var siteService = await httpContext.AuthenticateAsync(SiteServiceAuthentication.SchemeName);
            if (siteService.Principal is { } principal && SiteServiceAuthentication.TryReadTenantId(principal, out var siteTenantId))
            {
                tenantContext.Resolve(siteTenantId, SiteServiceAuthentication.CallerId);
            }
        }

        await next(httpContext);
    }
}

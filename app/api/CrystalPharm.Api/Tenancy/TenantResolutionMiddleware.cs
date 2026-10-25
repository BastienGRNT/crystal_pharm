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
        var isManager = ManagerClaims.TryRead(httpContext.User, out var managerTenantId, out var accountId);
        var siteService = httpContext.Request.Headers.ContainsKey(SiteServiceAuthentication.ServiceKeyHeader)
            ? await httpContext.AuthenticateAsync(SiteServiceAuthentication.SchemeName)
            : null;
        var isSiteService = siteService?.Principal is { } principal && SiteServiceAuthentication.TryReadTenantId(principal, out _);

        if (isManager && siteService is not null)
        {
            httpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
            return;
        }

        if (isManager)
        {
            tenantContext.Resolve(managerTenantId, accountId!);
        }
        else if (isSiteService)
        {
            SiteServiceAuthentication.TryReadTenantId(siteService!.Principal!, out var siteTenantId);
            tenantContext.Resolve(siteTenantId, SiteServiceAuthentication.CallerId);
        }

        await next(httpContext);
    }
}

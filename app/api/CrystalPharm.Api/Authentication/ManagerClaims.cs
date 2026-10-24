using System.Diagnostics.CodeAnalysis;
using System.Security.Claims;

namespace CrystalPharm.Api.Authentication;

/// <summary>Ce que le JWT de Better Auth d'un Manager porte : son compte et son Tenant actif.</summary>
public static class ManagerClaims
{
    public const string TenantId = "tenantId";
    public const string AccountId = "sub";

    public static bool TryRead(
        ClaimsPrincipal user,
        out Guid tenantId,
        [NotNullWhen(true)] out string? accountId)
    {
        var hasTenant = Guid.TryParse(user.FindFirst(TenantId)?.Value, out tenantId);
        accountId = user.FindFirst(AccountId)?.Value;
        var isManager = user.Identity?.AuthenticationType == ManagerAuthentication.SchemeName;
        return isManager && hasTenant && !string.IsNullOrEmpty(accountId);
    }
}

using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace CrystalPharm.Api.Authentication;

/// <summary>
/// L'identité de service de <c>site</c> : une clé partagée dans <c>X-Site-Service-Key</c>, et le Tenant du
/// site visité dans <c>X-Tenant-Id</c>. Ce Tenant est écrasé par la passerelle pour tout en-tête venu du
/// navigateur ; seul <c>site</c>, qui connaît la clé, peut donc l'écrire. Le C# n'est jamais exposé à Internet.
/// </summary>
public static class SiteServiceAuthentication
{
    public const string SchemeName = "SiteService";
    public const string PolicyName = "SiteService";
    public const string ServiceKeyHeader = "X-Site-Service-Key";
    public const string TenantIdHeader = "X-Tenant-Id";
    public const string CallerId = "site-service";

    private const int MinimumKeyLength = 32;

    public static IServiceCollection AddSiteServiceAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        var apiKey = configuration["SiteService:ApiKey"];
        if (apiKey is null || apiKey.Length < MinimumKeyLength)
        {
            throw new InvalidOperationException($"SiteService__ApiKey is missing from the environment, or shorter than {MinimumKeyLength} characters.");
        }

        services.AddAuthentication().AddScheme<SiteServiceOptions, SiteServiceHandler>(SchemeName, options => options.ApiKey = apiKey);
        services.AddAuthorizationBuilder().AddPolicy(PolicyName, policy => policy
            .AddAuthenticationSchemes(SchemeName)
            .RequireAuthenticatedUser()
            .RequireAssertion(context => TryReadTenantId(context.User, out _)));
        return services;
    }

    public static bool TryReadTenantId(ClaimsPrincipal user, out Guid tenantId)
    {
        tenantId = Guid.Empty;
        return user.Identity?.AuthenticationType == SchemeName
            && Guid.TryParse(user.FindFirst(ManagerClaims.TenantId)?.Value, out tenantId);
    }

    public sealed class SiteServiceOptions : AuthenticationSchemeOptions
    {
        public string ApiKey { get; set; } = string.Empty;
    }

    private sealed class SiteServiceHandler(
        IOptionsMonitor<SiteServiceOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder) : AuthenticationHandler<SiteServiceOptions>(options, logger, encoder)
    {
        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            if (!Request.Headers.TryGetValue(ServiceKeyHeader, out var receivedKey))
            {
                return Task.FromResult(AuthenticateResult.NoResult());
            }

            var isKnownKey = CryptographicOperations.FixedTimeEquals(
                SHA256.HashData(Encoding.UTF8.GetBytes(receivedKey.ToString())),
                SHA256.HashData(Encoding.UTF8.GetBytes(Options.ApiKey)));
            if (!isKnownKey || !Guid.TryParse(Request.Headers[TenantIdHeader].ToString(), out var tenantId) || tenantId == Guid.Empty)
            {
                return Task.FromResult(AuthenticateResult.Fail("The site service identity is not valid."));
            }

            var identity = new ClaimsIdentity(
                [new Claim(ManagerClaims.TenantId, tenantId.ToString()), new Claim(ManagerClaims.AccountId, CallerId)],
                SchemeName);
            return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(identity), SchemeName)));
        }
    }
}

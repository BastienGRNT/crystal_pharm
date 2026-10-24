using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;

namespace CrystalPharm.Api.Authentication;

/// <summary>
/// Le JWT court d'un Manager, émis par Better Auth et vérifié par les clés publiques
/// du JWKS interne de <c>pharmacy/host</c> (<c>kid</c>, <c>iss</c>, <c>aud</c>).
/// </summary>
public static class ManagerAuthentication
{
    public const string SchemeName = "Manager";
    public const string PolicyName = "Manager";

    // Le JWT est court (≤ 15 min) : un compte désactivé perd l'accès au plus tard à son expiration.
    private static readonly TimeSpan AllowedClockSkew = TimeSpan.FromSeconds(30);

    public static IServiceCollection AddManagerAuthentication(
        this IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        var settings = configuration.GetSection("ManagerJwt");
        var jwksUrl = RequireSetting(settings, "JwksUrl");

        services.AddAuthentication(SchemeName).AddJwtBearer(SchemeName, options =>
        {
            options.MapInboundClaims = false;
            options.ConfigurationManager = new ConfigurationManager<OpenIdConnectConfiguration>(
                jwksUrl,
                new JsonWebKeySetRetriever(),
                new HttpDocumentRetriever { RequireHttps = !environment.IsDevelopment() });
            options.TokenValidationParameters = new TokenValidationParameters
            {
                // Distingue un Manager de l'identité de service de `site` (cf. ManagerClaims).
                AuthenticationType = SchemeName,
                ValidIssuer = RequireSetting(settings, "Issuer"),
                ValidAudience = RequireSetting(settings, "Audience"),
                ValidAlgorithms = [SecurityAlgorithms.RsaSha256, SecurityAlgorithms.EcdsaSha256],
                RequireExpirationTime = true,
                ClockSkew = AllowedClockSkew,
            };
        });

        services.AddAuthorizationBuilder().AddPolicy(PolicyName, policy => policy
            .AddAuthenticationSchemes(SchemeName)
            .RequireAuthenticatedUser()
            .RequireAssertion(context => ManagerClaims.TryRead(context.User, out _, out _)));

        return services;
    }

    private static string RequireSetting(IConfigurationSection settings, string settingName) =>
        settings[settingName] ?? throw new InvalidOperationException($"ManagerJwt__{settingName} is missing from the environment.");

    /// <summary>Better Auth publie un JWKS seul, sans document de découverte OpenID.</summary>
    private sealed class JsonWebKeySetRetriever : IConfigurationRetriever<OpenIdConnectConfiguration>
    {
        public async Task<OpenIdConnectConfiguration> GetConfigurationAsync(
            string address,
            IDocumentRetriever retriever,
            CancellationToken cancel)
        {
            var jsonWebKeySet = new JsonWebKeySet(await retriever.GetDocumentAsync(address, cancel));
            var configuration = new OpenIdConnectConfiguration();
            foreach (var signingKey in jsonWebKeySet.GetSigningKeys())
            {
                configuration.SigningKeys.Add(signingKey);
            }

            return configuration;
        }
    }
}

using System.Security.Cryptography;
using CrystalPharm.Api.Authentication;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace CrystalPharm.Api.IntegrationTests;

/// <summary>Des JWT de Manager comme Better Auth les émet, signés par une clé de test.</summary>
public sealed class ManagerTokens
{
    public const string Issuer = "http://localhost:5173";
    public const string Audience = "crystal-pharm-api";

    public RsaSecurityKey SigningKey { get; } = new(RSA.Create(2048)) { KeyId = "test-key" };

    public string IssueFor(Guid tenantId, string audience = Audience) =>
        new JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
        {
            Issuer = Issuer,
            Audience = audience,
            Expires = DateTime.UtcNow.AddMinutes(15),
            Claims = new Dictionary<string, object>
            {
                [ManagerClaims.AccountId] = $"account-of-{tenantId}",
                [ManagerClaims.TenantId] = tenantId.ToString(),
            },
            SigningCredentials = new SigningCredentials(SigningKey, SecurityAlgorithms.RsaSha256),
        });
}

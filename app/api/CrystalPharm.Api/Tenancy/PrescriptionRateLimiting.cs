using System.Threading.RateLimiting;
using CrystalPharm.SharedKernel.Tenancy;
using Microsoft.AspNetCore.RateLimiting;

namespace CrystalPharm.Api.Tenancy;

/// <summary>
/// Limite les appels d'envoi d'ordonnance par pharmacie : un site abusé ne peut pas saturer le stockage.
/// Un envoi par liens pré-signés compte deux appels (le début et la confirmation).
/// </summary>
public static class PrescriptionRateLimiting
{
    public const string PolicyName = "prescriptions";

    private const int RequestsPerMinutePerTenant = 60;

    public static IServiceCollection AddPrescriptionRateLimiting(this IServiceCollection services) =>
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.AddPolicy(PolicyName, httpContext =>
            {
                var tenantContext = httpContext.RequestServices.GetRequiredService<ITenantContext>();
                return RateLimitPartition.GetFixedWindowLimiter(
                    tenantContext.IsResolved ? tenantContext.TenantId.ToString() : "unresolved",
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = RequestsPerMinutePerTenant,
                        Window = TimeSpan.FromMinutes(1),
                    });
            });
        });
}

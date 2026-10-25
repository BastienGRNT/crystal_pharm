using System.Threading.RateLimiting;
using CrystalPharm.SharedKernel.Tenancy;
using Microsoft.AspNetCore.RateLimiting;

namespace CrystalPharm.Api.Tenancy;

/// <summary>Limite les envois d'ordonnance par pharmacie : un site abusé ne peut pas saturer le disque.</summary>
public static class PrescriptionRateLimiting
{
    public const string PolicyName = "prescriptions";

    private const int SubmissionsPerMinutePerTenant = 30;

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
                        PermitLimit = SubmissionsPerMinutePerTenant,
                        Window = TimeSpan.FromMinutes(1),
                    });
            });
        });
}

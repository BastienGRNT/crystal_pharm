using System.Threading.RateLimiting;
using CrystalPharm.SharedKernel.Tenancy;
using Microsoft.AspNetCore.RateLimiting;

namespace CrystalPharm.Api.Tenancy;

/// <summary>Limite la prise de rendez-vous du Visitor par pharmacie : un site abusé ne peut pas saturer le planning.</summary>
public static class AppointmentRateLimiting
{
    public const string PolicyName = "visitor-appointments";

    private const int RequestsPerMinutePerTenant = 120;

    public static IServiceCollection AddAppointmentRateLimiting(this IServiceCollection services) =>
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

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace CrystalPharm.SharedKernel.Persistence.Tenancy;

public static class TenantScopedDbContextRegistration
{
    /// <summary>
    /// Enregistre le contexte avec les deux intercepteurs du Tenant : celui qui pose et vérifie le
    /// <c>TenantId</c> à l'écriture, et celui qui pose le Tenant de la Row-Level Security par transaction.
    /// </summary>
    public static IServiceCollection AddTenantScopedDbContext<TContext>(
        this IServiceCollection services,
        Action<DbContextOptionsBuilder> configureDatabase)
        where TContext : TenantScopedDbContext
    {
        services.AddScoped<TenantOwnershipInterceptor>();
        services.AddScoped<TenantTransactionInterceptor>();
        services.AddDbContext<TContext>((serviceProvider, options) =>
        {
            configureDatabase(options);
            options.AddInterceptors(
                serviceProvider.GetRequiredService<TenantOwnershipInterceptor>(),
                serviceProvider.GetRequiredService<TenantTransactionInterceptor>());
        });
        return services;
    }
}

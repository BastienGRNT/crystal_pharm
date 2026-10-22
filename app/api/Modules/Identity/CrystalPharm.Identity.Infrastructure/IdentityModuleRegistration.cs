using CrystalPharm.Identity.Application.Interfaces;
using CrystalPharm.Identity.Infrastructure.Persistence;
using CrystalPharm.Identity.Infrastructure.Repositories;
using CrystalPharm.Identity.Infrastructure.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CrystalPharm.Identity.Infrastructure;

public static class IdentityModuleRegistration
{
    private const string IdentitySchema = "identity";

    public static IServiceCollection AddIdentityModule(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<IdentityModuleDbContext>(options =>
            options.UseNpgsql(
                configuration.GetConnectionString("Identity"),
                npgsql => npgsql.MigrationsHistoryTable("__EFMigrationsHistory", IdentitySchema)));

        services
            .AddIdentity<ApplicationUser, IdentityRole<Guid>>(options =>
            {
                options.Password.RequiredLength = 8;
                options.User.RequireUniqueEmail = true;
            })
            .AddEntityFrameworkStores<IdentityModuleDbContext>()
            .AddSignInManager()
            .AddClaimsPrincipalFactory<AppUserClaimsPrincipalFactory>();

        services.Configure<JwtOptions>(configuration.GetSection("Jwt"));

        services.AddScoped<ITenantRepository, TenantRepository>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<JwtTokenService>();

        return services;
    }
}

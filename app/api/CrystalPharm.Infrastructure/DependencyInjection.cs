using CrystalPharm.Application.Interfaces;
using CrystalPharm.Infrastructure.Persistence;
using CrystalPharm.Infrastructure.Repositories;
using CrystalPharm.Infrastructure.Identity;
using CrystalPharm.Infrastructure.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ApplicationUser = CrystalPharm.Infrastructure.Identity.ApplicationUser;

namespace CrystalPharm.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("Default")));

        services
            .AddIdentity<ApplicationUser, IdentityRole<Guid>>(options =>
            {
                options.Password.RequiredLength = 8;
                options.User.RequireUniqueEmail = true;
            })
            .AddEntityFrameworkStores<AppDbContext>()
            .AddSignInManager()
            .AddClaimsPrincipalFactory<AppUserClaimsPrincipalFactory>();

        services.Configure<JwtOptions>(configuration.GetSection("Jwt"));

        services.AddScoped<ITenantRepository, TenantRepository>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<JwtTokenService>();

        return services;
    }
}

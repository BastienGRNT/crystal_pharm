using CrystalPharm.Booking.Application.Interfaces;
using CrystalPharm.Booking.Application.Services;
using CrystalPharm.Booking.Infrastructure.Persistence;
using CrystalPharm.Booking.Infrastructure.Repositories;
using CrystalPharm.Booking.Infrastructure.Services;
using CrystalPharm.SharedKernel.Persistence.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace CrystalPharm.Booking.Infrastructure;

public static class BookingModuleRegistration
{
    private const string ConnectionStringName = "Booking";
    private const string PlanningConnectionStringName = "PlanningReadOnly";

    /// <summary>
    /// Le module Booking. L'hôte enregistre l'<see cref="SharedKernel.Tenancy.ITenantContext"/>
    /// de la requête et un <see cref="TimeProvider"/>.
    /// </summary>
    public static IServiceCollection AddBookingModule(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString(ConnectionStringName)
            ?? throw new InvalidOperationException($"ConnectionStrings__{ConnectionStringName} is missing from the environment.");

        services.AddTenantScopedDbContext<BookingDbContext>(options => ConfigureBookingDatabase(options, connectionString));
        services.AddScoped<IAppointmentRepository, AppointmentRepository>();
        services.AddScoped<IAppointmentConfigurationRepository, AppointmentConfigurationRepository>();
        services.AddScoped<IAppointmentConfigurationService, AppointmentConfigurationService>();
        services.AddScoped<IHealthDataAccessLog, HealthDataAccessLog>();
        services.AddScoped<IAppointmentService, AppointmentService>();
        services.AddScoped<IVisitorAppointmentService, VisitorAppointmentService>();
        AddStaffAvailabilityReader(services, configuration);
        return services;
    }

    private static void AddStaffAvailabilityReader(IServiceCollection services, IConfiguration configuration)
    {
        var planningConnectionString = configuration.GetConnectionString(PlanningConnectionStringName);
        if (string.IsNullOrWhiteSpace(planningConnectionString))
        {
            services.AddScoped<IStaffAvailabilityReader, NoStaffAvailabilityReader>();
            return;
        }

        services.AddSingleton(NpgsqlDataSource.Create(planningConnectionString));
        services.AddScoped<IStaffAvailabilityReader, StaffAvailabilityReader>();
    }

    /// <summary>Crée ou met à jour le schéma <c>booking</c> : en dev au démarrage, et dans les tests.</summary>
    public static async Task ApplyBookingMigrationsAsync(this IServiceProvider services, CancellationToken cancellationToken)
    {
        await using var scope = services.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<BookingDbContext>();
        await context.Database.MigrateAsync(cancellationToken);
    }

    internal static void ConfigureBookingDatabase(DbContextOptionsBuilder options, string connectionString)
    {
        options
            .UseNpgsql(connectionString, npgsql => npgsql.MigrationsHistoryTable("__EFMigrationsHistory", BookingDbContext.SchemaName))
            .UseSnakeCaseNamingConvention();
    }
}

using CrystalPharm.Api.Tenancy;
using CrystalPharm.Booking.Infrastructure;
using CrystalPharm.Prescriptions.Infrastructure;
using CrystalPharm.SharedKernel.Tenancy;

namespace CrystalPharm.Api.Database;

/// <summary>
/// Migre les schémas <c>booking</c> et <c>prescriptions</c>. Avec <c>ConnectionStrings__HealthMigrations</c>, par ce
/// rôle propriétaire, le temps de migrer : l'API tourne ensuite avec un rôle ordinaire, soumis à la Row-Level Security
/// (le propriétaire des tables y échappe). Sans, par les connexions de l'API, comme en dev.
/// </summary>
public static class HealthDatabaseMigrations
{
    private const string MigrationConnectionStringName = "HealthMigrations";

    public static async Task ApplyAsync(IServiceProvider applicationServices, IConfiguration configuration, CancellationToken cancellationToken)
    {
        var migrationConnectionString = configuration.GetConnectionString(MigrationConnectionStringName);
        if (string.IsNullOrWhiteSpace(migrationConnectionString))
        {
            await ApplyWithAsync(applicationServices, cancellationToken);
            return;
        }

        await using var migrationServices = BuildMigrationServices(configuration, migrationConnectionString);
        await ApplyWithAsync(migrationServices, cancellationToken);
    }

    private static async Task ApplyWithAsync(IServiceProvider services, CancellationToken cancellationToken)
    {
        await services.ApplyBookingMigrationsAsync(cancellationToken);
        await services.ApplyPrescriptionsMigrationsAsync(cancellationToken);
    }

    private static ServiceProvider BuildMigrationServices(IConfiguration configuration, string migrationConnectionString)
    {
        var migrationConfiguration = new ConfigurationBuilder()
            .AddConfiguration(configuration)
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:Booking"] = migrationConnectionString,
                ["ConnectionStrings:Prescriptions"] = migrationConnectionString,
                ["ConnectionStrings:PlanningReadOnly"] = null,
            })
            .Build();
        return new ServiceCollection()
            .AddSingleton(TimeProvider.System)
            .AddScoped<ITenantContext, RequestTenantContext>()
            .AddBookingModule(migrationConfiguration)
            .AddPrescriptionsModule(migrationConfiguration)
            .BuildServiceProvider();
    }
}

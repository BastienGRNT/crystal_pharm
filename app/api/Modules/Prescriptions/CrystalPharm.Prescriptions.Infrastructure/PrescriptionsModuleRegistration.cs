using CrystalPharm.Prescriptions.Application.Interfaces;
using CrystalPharm.Prescriptions.Application.Services;
using CrystalPharm.Prescriptions.Infrastructure.Persistence;
using CrystalPharm.Prescriptions.Infrastructure.Repositories;
using CrystalPharm.Prescriptions.Infrastructure.Services;
using CrystalPharm.Prescriptions.Infrastructure.Storage;
using CrystalPharm.SharedKernel.Persistence.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CrystalPharm.Prescriptions.Infrastructure;

public static class PrescriptionsModuleRegistration
{
    private const string ConnectionStringName = "Prescriptions";
    private const string LocalDirectorySetting = "PrescriptionStorage:LocalDirectory";

    /// <summary>
    /// Le module Prescriptions. L'hôte enregistre l'<see cref="SharedKernel.Tenancy.ITenantContext"/>
    /// de la requête et un <see cref="TimeProvider"/>. Les fichiers vont dans un dossier local
    /// (<c>PrescriptionStorage__LocalDirectory</c>) tant qu'il n'y a pas d'hébergeur HDS.
    /// </summary>
    public static IServiceCollection AddPrescriptionsModule(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString(ConnectionStringName)
            ?? throw new InvalidOperationException($"ConnectionStrings__{ConnectionStringName} is missing from the environment.");
        var localDirectory = configuration[LocalDirectorySetting]
            ?? throw new InvalidOperationException("PrescriptionStorage__LocalDirectory is missing from the environment.");

        services.AddTenantScopedDbContext<PrescriptionsDbContext>(options => ConfigurePrescriptionsDatabase(options, connectionString));
        services.AddScoped<IPrescriptionSubmissionRepository, PrescriptionSubmissionRepository>();
        services.AddSingleton<IPrescriptionDocumentStore>(new LocalDiskPrescriptionDocumentStore(localDirectory));
        services.AddSingleton<IMalwareScanner, NoOpMalwareScanner>();
        services.AddScoped<IPrescriptionAccessLog, PrescriptionAccessLog>();
        services.AddScoped<IPrescriptionSubmissionService, PrescriptionSubmissionService>();
        return services;
    }

    /// <summary>Crée ou met à jour le schéma <c>prescriptions</c> : en dev au démarrage, et dans les tests.</summary>
    public static async Task ApplyPrescriptionsMigrationsAsync(this IServiceProvider services, CancellationToken cancellationToken)
    {
        await using var scope = services.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<PrescriptionsDbContext>();
        await context.Database.MigrateAsync(cancellationToken);
    }

    internal static void ConfigurePrescriptionsDatabase(DbContextOptionsBuilder options, string connectionString)
    {
        options
            .UseNpgsql(connectionString, npgsql => npgsql.MigrationsHistoryTable("__EFMigrationsHistory", PrescriptionsDbContext.SchemaName))
            .UseSnakeCaseNamingConvention();
    }
}

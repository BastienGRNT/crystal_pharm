using CrystalPharm.SharedKernel.Persistence.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace CrystalPharm.Prescriptions.Infrastructure.Persistence;

/// <summary>Pour <c>dotnet ef migrations add</c>, qui construit le modèle sans base ni requête.</summary>
internal sealed class PrescriptionsDesignTimeDbContextFactory : IDesignTimeDbContextFactory<PrescriptionsDbContext>
{
    public PrescriptionsDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<PrescriptionsDbContext>();
        PrescriptionsModuleRegistration.ConfigurePrescriptionsDatabase(options, "Host=localhost");
        return new PrescriptionsDbContext(options.Options, new DesignTimeTenantContext());
    }
}

using CrystalPharm.SharedKernel.Tenancy;
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
        return new PrescriptionsDbContext(options.Options, new NoTenantContext());
    }

    private sealed class NoTenantContext : ITenantContext
    {
        public bool IsResolved => false;
        public Guid TenantId => throw new InvalidOperationException("No tenant at design time.");
        public string CallerId => throw new InvalidOperationException("No caller at design time.");
    }
}

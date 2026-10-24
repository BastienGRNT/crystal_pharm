using CrystalPharm.SharedKernel.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace CrystalPharm.Booking.Infrastructure.Persistence;

/// <summary>Pour <c>dotnet ef migrations add</c>, qui construit le modèle sans base ni requête.</summary>
internal sealed class BookingDesignTimeDbContextFactory : IDesignTimeDbContextFactory<BookingDbContext>
{
    public BookingDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<BookingDbContext>();
        BookingModuleRegistration.ConfigureBookingDatabase(options, "Host=localhost");
        return new BookingDbContext(options.Options, new NoTenantContext());
    }

    private sealed class NoTenantContext : ITenantContext
    {
        public bool IsResolved => false;
        public Guid TenantId => throw new InvalidOperationException("No tenant at design time.");
        public string CallerId => throw new InvalidOperationException("No caller at design time.");
    }
}

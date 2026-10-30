using CrystalPharm.SharedKernel.Persistence.Tenancy;
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
        return new BookingDbContext(options.Options, new DesignTimeTenantContext());
    }
}

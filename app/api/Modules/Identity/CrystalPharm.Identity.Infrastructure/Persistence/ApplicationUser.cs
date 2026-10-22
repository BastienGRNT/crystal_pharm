using Microsoft.AspNetCore.Identity;

namespace CrystalPharm.Identity.Infrastructure.Persistence;

internal class ApplicationUser : IdentityUser<Guid>
{
    public Guid TenantId { get; set; }
}

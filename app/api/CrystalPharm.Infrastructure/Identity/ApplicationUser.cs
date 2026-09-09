using Microsoft.AspNetCore.Identity;

namespace CrystalPharm.Infrastructure.Identity;

public class ApplicationUser : IdentityUser<Guid>
{
    public Guid TenantId { get; set; }
}

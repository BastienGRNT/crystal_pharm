using CrystalPharm.Identity.Application.Interfaces;
using CrystalPharm.Identity.Domain.Entities;
using CrystalPharm.Identity.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CrystalPharm.Identity.Infrastructure.Repositories;

internal class TenantRepository : ITenantRepository
{
    private readonly IdentityModuleDbContext _db;

    public TenantRepository(IdentityModuleDbContext db)
    {
        _db = db;
    }

    public async Task<Tenant> AddAsync(Tenant tenant)
    {
        _db.Tenants.Add(tenant);
        await _db.SaveChangesAsync();
        return tenant;
    }

    public Task<Tenant?> GetByIdAsync(Guid id)
    {
        return _db.Tenants.FirstOrDefaultAsync(t => t.Id == id);
    }
}

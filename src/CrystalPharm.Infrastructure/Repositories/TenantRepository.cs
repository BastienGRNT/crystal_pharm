using CrystalPharm.Application.Interfaces;
using CrystalPharm.Domain.Entities;
using CrystalPharm.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CrystalPharm.Infrastructure.Repositories;

public class TenantRepository : ITenantRepository
{
    private readonly AppDbContext _db;

    public TenantRepository(AppDbContext db)
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

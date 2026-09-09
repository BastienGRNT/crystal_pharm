using CrystalPharm.Domain.Entities;

namespace CrystalPharm.Application.Interfaces;

public interface ITenantRepository
{
    Task<Tenant> AddAsync(Tenant tenant);
    Task<Tenant?> GetByIdAsync(Guid id);
}

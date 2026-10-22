using CrystalPharm.Identity.Domain.Entities;

namespace CrystalPharm.Identity.Application.Interfaces;

public interface ITenantRepository
{
    Task<Tenant> AddAsync(Tenant tenant);
    Task<Tenant?> GetByIdAsync(Guid id);
}

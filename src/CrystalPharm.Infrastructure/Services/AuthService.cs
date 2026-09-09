using CrystalPharm.Application.Dtos;
using CrystalPharm.Application.Interfaces;
using CrystalPharm.Domain.Entities;
using CrystalPharm.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using ApplicationUser = CrystalPharm.Infrastructure.Identity.ApplicationUser;

namespace CrystalPharm.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly ITenantRepository _tenantRepository;
    private readonly JwtTokenService _jwtTokenService;

    public AuthService(
        AppDbContext db,
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        ITenantRepository tenantRepository,
        JwtTokenService jwtTokenService)
    {
        _db = db;
        _userManager = userManager;
        _signInManager = signInManager;
        _tenantRepository = tenantRepository;
        _jwtTokenService = jwtTokenService;
    }

    public async Task<AuthResult> RegisterAsync(RegisterRequest request)
    {
        await using var transaction = await _db.Database.BeginTransactionAsync();

        var tenant = await _tenantRepository.AddAsync(new Tenant
        {
            Id = Guid.NewGuid(),
            Name = request.PharmacyName,
            Domain = string.Empty,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
        });

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = request.Email,
            Email = request.Email,
            TenantId = tenant.Id,
        };

        var createResult = await _userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
        {
            await transaction.RollbackAsync();
            return new AuthResult
            {
                Succeeded = false,
                Error = string.Join("; ", createResult.Errors.Select(e => e.Description)),
            };
        }

        await transaction.CommitAsync();

        await _signInManager.SignInAsync(user, isPersistent: false);

        var token = _jwtTokenService.GenerateToken(user.Id, user.TenantId);

        return new AuthResult
        {
            Succeeded = true,
            Token = token,
            UserId = user.Id,
            TenantId = user.TenantId,
        };
    }

    public async Task<AuthResult> LoginAsync(LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null)
        {
            return new AuthResult { Succeeded = false, Error = "Email ou mot de passe invalide." };
        }

        var result = await _signInManager.PasswordSignInAsync(user, request.Password, isPersistent: false, lockoutOnFailure: false);
        if (!result.Succeeded)
        {
            return new AuthResult { Succeeded = false, Error = "Email ou mot de passe invalide." };
        }

        var token = _jwtTokenService.GenerateToken(user.Id, user.TenantId);

        return new AuthResult
        {
            Succeeded = true,
            Token = token,
            UserId = user.Id,
            TenantId = user.TenantId,
        };
    }

    public async Task LogoutAsync()
    {
        await _signInManager.SignOutAsync();
    }
}

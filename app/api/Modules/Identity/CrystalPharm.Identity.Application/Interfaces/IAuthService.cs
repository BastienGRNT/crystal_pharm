using CrystalPharm.Identity.Application.Dtos;

namespace CrystalPharm.Identity.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResult> RegisterAsync(RegisterRequest request);
    Task<AuthResult> LoginAsync(LoginRequest request);
    Task LogoutAsync();
}

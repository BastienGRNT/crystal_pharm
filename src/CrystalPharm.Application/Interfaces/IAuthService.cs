using CrystalPharm.Application.Dtos;

namespace CrystalPharm.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResult> RegisterAsync(RegisterRequest request);
    Task<AuthResult> LoginAsync(LoginRequest request);
    Task LogoutAsync();
}

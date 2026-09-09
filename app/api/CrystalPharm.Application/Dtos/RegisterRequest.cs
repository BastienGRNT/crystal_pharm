namespace CrystalPharm.Application.Dtos;

public class RegisterRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string PharmacyName { get; set; } = string.Empty;
}

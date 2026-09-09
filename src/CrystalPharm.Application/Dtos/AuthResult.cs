namespace CrystalPharm.Application.Dtos;

public class AuthResult
{
    public bool Succeeded { get; set; }
    public string? Error { get; set; }
    public string? Token { get; set; }
    public Guid UserId { get; set; }
    public Guid TenantId { get; set; }
}

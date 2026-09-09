namespace CrystalPharm.Application.Dtos;

public class CurrentUserDto
{
    public Guid UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public Guid TenantId { get; set; }
}

namespace CrystalPharm.SharedKernel.Tenancy;

/// <summary>
/// Qui appelle, pour quel Tenant : rempli une fois par requête, depuis le JWT d'un
/// Manager ou l'identité de service de <c>site</c>, jamais depuis un paramètre.
/// </summary>
public interface ITenantContext
{
    bool IsResolved { get; }

    /// <exception cref="InvalidOperationException">Quand aucun Tenant n'est résolu pour la requête.</exception>
    Guid TenantId { get; }

    /// <summary>L'identifiant du compte du Manager, ou celui du service appelant.</summary>
    /// <exception cref="InvalidOperationException">Quand aucun Tenant n'est résolu pour la requête.</exception>
    string CallerId { get; }
}

import type { ToolKey } from '@crystal-pharm/billing-db/domain';
import { hasResponsibility, type ResponsibilityKey, type TenantMemberAccess } from '@crystal-pharm/pharmacy-db/domain';

/**
 * La Responsibility qui ouvre chaque Tool. Le planning de l'équipe la demande tant que
 * le planning d'un Employee (le sien, sans Responsibility) n'existe pas.
 */
export const toolResponsibilityKeys: Record<ToolKey, ResponsibilityKey> = {
	site: 'edit-site',
	planning: 'manage-team-planning',
	booking: 'handle-appointments',
	prescriptions: 'handle-prescriptions'
};

/** Les Tools que le Tenant a activés et que ce TenantMember a le droit d'ouvrir. */
export function keepToolsPermittedToMember(
	accessibleToolKeys: readonly ToolKey[],
	memberAccess: TenantMemberAccess
): ToolKey[] {
	return accessibleToolKeys.filter((toolKey) => hasResponsibility(memberAccess, toolResponsibilityKeys[toolKey]));
}

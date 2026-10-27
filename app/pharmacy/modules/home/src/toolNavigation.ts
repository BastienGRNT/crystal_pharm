import type { ToolKey } from '@crystal-pharm/billing-db/domain';
import type { ResponsibilityKey } from '@crystal-pharm/pharmacy-db/domain';
import type { NavigationLink } from '@crystal-pharm/ui';

/** Un lien du menu des outils ; `toolKey` le réserve aux pharmacies qui ont activé ce Tool (et aux comptes qui y ont droit). */
export type ToolNavigationLink = NavigationLink & { toolKey?: ToolKey };

/** Un lien vers une page de la pharmacie : réservé à une Responsibility, ou aux Owners. */
export type AccountNavigationLink = NavigationLink & {
	responsibilityKey?: ResponsibilityKey;
	isReservedToOwners?: boolean;
};

export function keepAccessibleLinks(
	toolLinks: readonly ToolNavigationLink[],
	accessibleToolKeys: readonly ToolKey[]
): ToolNavigationLink[] {
	return toolLinks.filter((toolLink) => !toolLink.toolKey || accessibleToolKeys.includes(toolLink.toolKey));
}

export function keepPermittedAccountLinks(
	accountLinks: readonly AccountNavigationLink[],
	member: { responsibilityKeys: readonly ResponsibilityKey[]; canManageSubscriptionAndAccess: boolean }
): AccountNavigationLink[] {
	return accountLinks.filter(
		(accountLink) =>
			(!accountLink.isReservedToOwners || member.canManageSubscriptionAndAccess) &&
			(!accountLink.responsibilityKey || member.responsibilityKeys.includes(accountLink.responsibilityKey))
	);
}

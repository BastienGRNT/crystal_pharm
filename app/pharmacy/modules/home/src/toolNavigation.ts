import type { ToolKey } from '@crystal-pharm/billing-db/domain';
import type { NavigationLink } from '@crystal-pharm/ui';

/** Un lien du menu des outils ; `toolKey` le réserve aux pharmacies qui ont activé ce Tool. */
export type ToolNavigationLink = NavigationLink & { toolKey?: ToolKey };

export function keepAccessibleLinks(
	toolLinks: readonly ToolNavigationLink[],
	accessibleToolKeys: readonly ToolKey[]
): ToolNavigationLink[] {
	return toolLinks.filter((toolLink) => !toolLink.toolKey || accessibleToolKeys.includes(toolLink.toolKey));
}

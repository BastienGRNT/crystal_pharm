import { canTenantUseTool } from '@crystal-pharm/billing-db';
import type { ToolKey } from '@crystal-pharm/billing-db/domain';
import { findActiveTenantIdOfAccount } from '@crystal-pharm/pharmacy-db';
import { redirect, type Handle } from '@sveltejs/kit';
import { subscriptionPathnameHighlighting } from '../../homePathnames';

export type ProtectedTool = { pathnamePrefix: string; toolKey: ToolKey };

/**
 * Ferme les pages (et les actions) d'un Tool que la pharmacie n'a pas activé :
 * on est renvoyé vers l'abonnement, le module mis en avant.
 */
export function createToolAccessHandle(protectedTools: readonly ProtectedTool[]): Handle {
	return async ({ event, resolve }) => {
		const protectedTool = protectedTools.find(
			({ pathnamePrefix }) => event.url.pathname === pathnamePrefix || event.url.pathname.startsWith(`${pathnamePrefix}/`)
		);
		if (protectedTool && event.locals.user) {
			const tenantId = await findActiveTenantIdOfAccount(event.locals.user.userId);
			if (tenantId && !(await canTenantUseTool(tenantId, protectedTool.toolKey))) {
				redirect(303, subscriptionPathnameHighlighting(protectedTool.toolKey));
			}
		}
		return resolve(event);
	};
}

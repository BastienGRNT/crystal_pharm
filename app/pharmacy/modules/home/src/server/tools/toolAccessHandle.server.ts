import { canTenantUseTool } from '@crystal-pharm/billing-db';
import type { ToolKey } from '@crystal-pharm/billing-db/domain';
import { findActiveTenantMemberAccess } from '@crystal-pharm/pharmacy-db';
import { hasResponsibility } from '@crystal-pharm/pharmacy-db/domain';
import { error, redirect, type Handle } from '@sveltejs/kit';
import { toolResponsibilityKeys } from '../../domain/toolResponsibilities';
import { subscriptionPathnameHighlighting } from '../../homePathnames';

export type ProtectedTool = { pathnamePrefix: string; toolKey: ToolKey };

/**
 * Ferme les pages (et les actions) d'un Tool : à un TenantMember sans la Responsibility
 * qui l'ouvre (refusé), et à tous tant que la pharmacie ne l'a pas activé (renvoyé vers
 * l'abonnement, le module mis en avant).
 */
export function createToolAccessHandle(protectedTools: readonly ProtectedTool[]): Handle {
	return async ({ event, resolve }) => {
		const protectedTool = protectedTools.find(
			({ pathnamePrefix }) => event.url.pathname === pathnamePrefix || event.url.pathname.startsWith(`${pathnamePrefix}/`)
		);
		if (protectedTool && event.locals.user) {
			const memberAccess = await findActiveTenantMemberAccess(event.locals.user.userId);
			if (memberAccess) {
				if (!hasResponsibility(memberAccess, toolResponsibilityKeys[protectedTool.toolKey])) {
					error(403, 'Votre compte n’a pas accès à ce module. Demandez-le à un titulaire de la pharmacie.');
				}
				if (!(await canTenantUseTool(memberAccess.tenantId, protectedTool.toolKey))) {
					redirect(303, subscriptionPathnameHighlighting(protectedTool.toolKey));
				}
			}
		}
		return resolve(event);
	};
}

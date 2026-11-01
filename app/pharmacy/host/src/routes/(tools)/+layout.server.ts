import { loadToolsShell } from '@crystal-pharm/home/server';
import { loadPlanningNotifications } from '@crystal-pharm/planning/server';
import { countPrescriptionsToHandle } from '@crystal-pharm/prescriptions/server';
import type { LayoutServerLoad } from './$types';

export const load = (async (event) => {
	const [toolsShell, notifications] = await Promise.all([loadToolsShell(event), loadPlanningNotifications(event)]);
	const prescriptionsToHandle = toolsShell.accessibleToolKeys.includes('prescriptions')
		? await countPrescriptionsToHandle(event)
		: null;
	const countsByHref: Record<string, number> = prescriptionsToHandle ? { '/prescriptions': prescriptionsToHandle } : {};
	return { ...toolsShell, notifications, countsByHref };
}) satisfies LayoutServerLoad;

import { loadToolsShell } from '@crystal-pharm/home/server';
import { loadPlanningNotifications } from '@crystal-pharm/planning/server';
import type { LayoutServerLoad } from './$types';

export const load = (async (event) => {
	const [toolsShell, notifications] = await Promise.all([loadToolsShell(event), loadPlanningNotifications(event)]);
	return { ...toolsShell, notifications };
}) satisfies LayoutServerLoad;

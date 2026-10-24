import { getTodayAppointments } from '@crystal-pharm/booking/server';
import { loadToolsHomePage } from '@crystal-pharm/home/server';
import { getTodayTeam } from '@crystal-pharm/planning/server';
import { toolLinks } from '$lib/toolLinks';
import type { PageServerLoad } from './$types';

const hrefOfTool = (toolKey: string): string => toolLinks.find((toolLink) => toolLink.toolKey === toolKey)?.href ?? '/';

// L'accueil résume la journée sans importer les modules : seul l'hôte les connaît.
export const load: PageServerLoad = (event) =>
	loadToolsHomePage(event, {
		team: { href: hrefOfTool('planning'), getTodayTeam },
		appointments: { href: hrefOfTool('booking'), getTodayAppointments }
	});

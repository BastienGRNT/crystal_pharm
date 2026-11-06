import { confirmAppointmentAndNotifyPatient, getTodayAppointments } from '@crystal-pharm/booking/server';
import { confirmAppointmentFromToolsHome, loadToolsHomePage, type TodaySources } from '@crystal-pharm/home/server';
import { getTodayTeam } from '@crystal-pharm/planning/server';
import { getTodayPrescriptions } from '@crystal-pharm/prescriptions/server';
import { getNextOnDutyPeriod } from '@crystal-pharm/site-manager/server';
import { toolLinks } from '$lib/toolLinks';
import type { Actions, PageServerLoad } from './$types';

const hrefOfTool = (toolKey: string): string => toolLinks.find((toolLink) => toolLink.toolKey === toolKey)?.href ?? '/';

// L'accueil résume la journée sans importer les modules : seul l'hôte les connaît.
const todaySources: TodaySources = {
	team: { href: hrefOfTool('planning'), getTodayTeam },
	appointments: { href: hrefOfTool('booking'), getTodayAppointments, confirmAppointment: confirmAppointmentAndNotifyPatient },
	prescriptions: { href: hrefOfTool('prescriptions'), getTodayPrescriptions },
	onDuty: { href: `${hrefOfTool('site')}/gardes`, getNextOnDutyPeriod }
};

export const load: PageServerLoad = (event) => loadToolsHomePage(event, todaySources);

export const actions = {
	confirmAppointment: (event) => confirmAppointmentFromToolsHome(event, todaySources)
} satisfies Actions;

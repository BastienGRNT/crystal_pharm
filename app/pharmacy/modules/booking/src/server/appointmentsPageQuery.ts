import type { AppointmentStatus, AppointmentStatusFilter } from '../domain/appointment';
import { appointmentStatuses } from '../domain/appointment';
import { parseDayParameter, toIsoDate } from '../domain/day';
import type { AppointmentsView } from '../pages/appointmentsPageData';

export type AppointmentsPageQuery = {
	day: Date;
	view: AppointmentsView;
	statusFilter: AppointmentStatusFilter;
};

export type AppointmentsPanel = { kind: 'none' } | { kind: 'detail'; appointmentId: string } | { kind: 'add' };

const viewParameters: Record<AppointmentsView, string> = { list: 'liste', day: 'journee', week: 'semaine' };

export const statusParameters: Record<AppointmentStatus, string> = {
	pending: 'en-attente',
	confirmed: 'confirmes',
	cancelled: 'annules'
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseViewParameter(viewParameter: string | null): AppointmentsView {
	const views = Object.keys(viewParameters) as AppointmentsView[];
	return views.find((view) => viewParameters[view] === viewParameter) ?? 'list';
}

function parseStatusParameter(statusParameter: string | null): AppointmentStatusFilter {
	return appointmentStatuses.find((status) => statusParameters[status] === statusParameter) ?? 'all';
}

export function parsePageQuery(url: URL, today: Date): AppointmentsPageQuery {
	return {
		day: parseDayParameter(url.searchParams.get('jour'), today),
		view: parseViewParameter(url.searchParams.get('vue')),
		statusFilter: parseStatusParameter(url.searchParams.get('statut'))
	};
}

/** `?rdv=<uuid>` ouvre la fiche, `?nouveau=1` le formulaire : l'URL ne porte jamais que l'identifiant opaque. */
export function parsePanel(url: URL): AppointmentsPanel {
	const appointmentId = url.searchParams.get('rdv');
	if (appointmentId && uuidPattern.test(appointmentId)) return { kind: 'detail', appointmentId };
	if (url.searchParams.get('nouveau') === '1') return { kind: 'add' };
	return { kind: 'none' };
}

function toSearchParams(query: AppointmentsPageQuery, panel: AppointmentsPanel): URLSearchParams {
	const searchParams = new URLSearchParams({ jour: toIsoDate(query.day) });
	if (query.view !== 'list') searchParams.set('vue', viewParameters[query.view]);
	if (query.statusFilter !== 'all') searchParams.set('statut', statusParameters[query.statusFilter]);
	if (panel.kind === 'detail') searchParams.set('rdv', panel.appointmentId);
	if (panel.kind === 'add') searchParams.set('nouveau', '1');
	return searchParams;
}

export function buildPageHref(
	query: AppointmentsPageQuery,
	changes: Partial<AppointmentsPageQuery> = {},
	panel: AppointmentsPanel = { kind: 'none' }
): string {
	return `?${toSearchParams({ ...query, ...changes }, panel).toString()}`;
}

export function buildActionHref(query: AppointmentsPageQuery, panel: AppointmentsPanel, actionName: string): string {
	return `?${toSearchParams(query, panel).toString()}&/${actionName}`;
}

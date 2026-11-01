import type { ActionListItem } from '@crystal-pharm/ui';
import type { TodayFigure } from '../../../pages/tools-home/toolsHomePageData';
import type { TodayAppointmentsSummary, TodayPrescriptionsSummary } from './todaySources';

export type PrescriptionsInput = { href: string; summary: TodayPrescriptionsSummary | undefined };
export type AppointmentsInput = { href: string; summary: TodayAppointmentsSummary | undefined };

const plural = (count: number, singular: string, pluralForm: string): string => `${count} ${count === 1 ? singular : pluralForm}`;

const countStillToPrepare = (summary: TodayPrescriptionsSummary): number =>
	summary.receivedCount + summary.inPreparationCount + summary.waitingForProductsCount;

function describePrescriptionsToPrepare(summary: TodayPrescriptionsSummary): Pick<TodayFigure, 'detail' | 'detailTone'> {
	if (summary.overdueCount > 0) return { detail: `dont ${summary.overdueCount} en retard`, detailTone: 'danger' };
	if (summary.soonCount > 0) {
		return { detail: `dont ${plural(summary.soonCount, 'attendue', 'attendues')} dans les 2 h`, detailTone: 'warning' };
	}
	if (summary.waitingForProductsCount > 0) {
		return { detail: `dont ${summary.waitingForProductsCount} en attente de produits`, detailTone: 'neutral' };
	}
	if (countStillToPrepare(summary) === 0) return { detail: 'Tout est préparé', detailTone: 'neutral' };
	return { detail: 'Rien d’urgent', detailTone: 'neutral' };
}

/** Trois chiffres à lire d'un coup d'œil, chacun ouvre la liste qu'il compte. */
export function listCounterFigures(prescriptions: PrescriptionsInput | undefined, appointments: AppointmentsInput | undefined): TodayFigure[] {
	const figures: TodayFigure[] = [];
	if (prescriptions) {
		const summary = prescriptions.summary;
		const unavailable = { value: '–', detail: 'Indisponible pour le moment', detailTone: 'neutral' } as const;
		figures.push(
			{
				key: 'prescriptions-to-prepare',
				label: 'Ordonnances à préparer',
				icon: 'prescription',
				module: 'ordo',
				href: prescriptions.href,
				...(summary ? { value: String(countStillToPrepare(summary)), ...describePrescriptionsToPrepare(summary) } : unavailable)
			},
			{
				key: 'prescriptions-ready',
				label: 'Prêtes, pas encore retirées',
				icon: 'package',
				module: 'ordo',
				href: `${prescriptions.href}${summary?.readyQuery ?? ''}`,
				...(summary
					? { value: String(summary.readyCount), detail: summary.readyCount > 0 ? 'Le patient peut passer' : 'Aucune en attente', detailTone: 'neutral' }
					: unavailable)
			}
		);
	}
	const appointmentsSummary = appointments?.summary;
	if (appointments && appointmentsSummary) {
		figures.push({
			key: 'appointments-to-confirm',
			label: 'Rendez-vous à confirmer',
			icon: 'calendar-check',
			module: 'rdv',
			href: `${appointments.href}${appointmentsSummary.pendingQuery}`,
			value: String(appointmentsSummary.pendingCount),
			detail: appointmentsSummary.pendingCount > 0 ? 'Le patient attend votre réponse' : 'Tout est confirmé',
			detailTone: appointmentsSummary.pendingCount > 0 ? 'warning' : 'neutral'
		});
	}
	return figures;
}

/** Une ordonnance dont le patient devait déjà passer : il est peut-être au comptoir. */
export function listPrescriptionTasks(prescriptions: PrescriptionsInput | undefined): ActionListItem[] {
	const overdueCount = prescriptions?.summary?.overdueCount ?? 0;
	if (!prescriptions || overdueCount === 0) return [];
	return [
		{
			id: 'overdue-prescriptions',
			title: overdueCount === 1 ? '1 ordonnance en retard' : `${overdueCount} ordonnances en retard`,
			detail: 'Le patient devait déjà passer : préparez-la, ou appelez-le.',
			tone: 'danger',
			actions: [{ label: 'Voir', isPrimary: true, href: prescriptions.href }]
		}
	];
}

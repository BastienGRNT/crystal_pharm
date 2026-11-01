import type { AuthenticatedUser } from '@crystal-pharm/auth';
import { classifyPlannedVisitUrgency, countByStatus, isStillToHandle } from '../domain/prescriptionQueue';
import { listReceivedPrescriptions } from './api/receivedPrescriptionsApi.server';
import type { PrescriptionsCaller } from './api/prescriptionsApiClient.server';
import { requirePrescriptionsCaller } from './prescriptionsCaller.server';

/**
 * Le nombre affiché à côté du menu : ce qui n'est pas encore remis au patient.
 * Un C# injoignable ne doit pas casser toutes les pages : le menu s'affiche alors sans nombre.
 */
export async function countPrescriptionsToHandle({ locals }: { locals: { user: AuthenticatedUser | null } }): Promise<number | null> {
	try {
		const summaries = await listReceivedPrescriptions(await requirePrescriptionsCaller(locals.user));
		return summaries.filter((summary) => isStillToHandle(summary.status) && summary.status !== 'ready').length;
	} catch {
		return null;
	}
}

/** Des nombres seulement : l'accueil ne montre jamais un patient ni son ordonnance. */
export type TodayPrescriptions = {
	receivedCount: number;
	inPreparationCount: number;
	waitingForProductsCount: number;
	readyCount: number;
	/** À préparer, et leur patient devait déjà passer. */
	overdueCount: number;
	/** À préparer, et leur patient passe dans les deux heures. */
	soonCount: number;
	/** Relatives au module : `?statut=received`. */
	receivedQuery: string;
	readyQuery: string;
};

export async function getTodayPrescriptions(caller: PrescriptionsCaller, now: Date): Promise<TodayPrescriptions> {
	const summaries = await listReceivedPrescriptions(caller);
	const counts = countByStatus(summaries);
	const stillToPrepare = summaries.filter((summary) => isStillToHandle(summary.status) && summary.status !== 'ready');
	const countByUrgency = (urgency: ReturnType<typeof classifyPlannedVisitUrgency>): number =>
		stillToPrepare.filter((summary) => classifyPlannedVisitUrgency(summary.plannedVisitAt, now) === urgency).length;

	return {
		receivedCount: counts.received,
		inPreparationCount: counts.inPreparation,
		waitingForProductsCount: counts.waitingForProducts,
		readyCount: counts.ready,
		overdueCount: countByUrgency('overdue'),
		soonCount: countByUrgency('soon'),
		receivedQuery: '?statut=received',
		readyQuery: '?statut=ready'
	};
}

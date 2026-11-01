import type { PrescriptionStatus, ReceivedPrescriptionSummary } from './receivedPrescription';

export const prescriptionStatusesInQueueOrder: readonly PrescriptionStatus[] = [
	'received',
	'inPreparation',
	'waitingForProducts',
	'ready',
	'collected'
];

/** Ce que l'équipe doit encore faire : tout sauf les ordonnances déjà retirées. */
export const isStillToHandle = (status: PrescriptionStatus): boolean => status !== 'collected';

export type PlannedVisitUrgency = 'overdue' | 'soon' | 'later' | 'whenReady';

// Deux heures : le temps de préparer une ordonnance courante entre deux patients au comptoir.
const soonWindowInMilliseconds = 2 * 60 * 60 * 1000;

export function classifyPlannedVisitUrgency(plannedVisitAt: string | null, now: Date): PlannedVisitUrgency {
	if (!plannedVisitAt) return 'whenReady';
	const millisecondsUntilVisit = new Date(plannedVisitAt).getTime() - now.getTime();
	if (millisecondsUntilVisit < 0) return 'overdue';
	if (millisecondsUntilVisit <= soonWindowInMilliseconds) return 'soon';
	return 'later';
}

/** Le geste suivant, proposé en un clic ; les autres restent possibles depuis la fiche. */
export function findNextStatus(status: PrescriptionStatus): PrescriptionStatus | null {
	const nextStatuses: Record<PrescriptionStatus, PrescriptionStatus | null> = {
		received: 'inPreparation',
		inPreparation: 'ready',
		waitingForProducts: 'ready',
		ready: 'collected',
		collected: null
	};
	return nextStatuses[status];
}

const timeOf = (isoDateTime: string): number => new Date(isoDateTime).getTime();

/**
 * Le passage le plus proche d'abord, puis les « dès que c'est prêt » par ordre d'arrivée.
 * Les retirées, elles, se lisent de la plus récente à la plus ancienne.
 */
export function sortForQueue(prescriptions: readonly ReceivedPrescriptionSummary[]): ReceivedPrescriptionSummary[] {
	return [...prescriptions].sort((first, second) => {
		if (first.status === 'collected' && second.status === 'collected') {
			return timeOf(second.statusChangedAt) - timeOf(first.statusChangedAt);
		}
		if (first.plannedVisitAt && second.plannedVisitAt) return timeOf(first.plannedVisitAt) - timeOf(second.plannedVisitAt);
		if (first.plannedVisitAt) return -1;
		if (second.plannedVisitAt) return 1;
		return timeOf(first.submittedAt) - timeOf(second.submittedAt);
	});
}

export function countByStatus(prescriptions: readonly ReceivedPrescriptionSummary[]): Record<PrescriptionStatus, number> {
	const counts: Record<PrescriptionStatus, number> = {
		received: 0,
		inPreparation: 0,
		waitingForProducts: 0,
		ready: 0,
		collected: 0
	};
	for (const prescription of prescriptions) counts[prescription.status] += 1;
	return counts;
}

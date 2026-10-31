import type { AbsenceKind } from '../planning';

/** Une absence posée par le titulaire est acceptée d'office ; celle que demande un employé attend sa réponse. */
export type AbsenceStatus = 'pending' | 'approved' | 'declined';

export const absenceStatuses = ['pending', 'approved', 'declined'] as const satisfies readonly AbsenceStatus[];

/** Ce qu'un employé peut demander lui-même ; un arrêt maladie se déclare au titulaire, pas par une demande. */
export type RequestableLeaveKind = Extract<AbsenceKind, 'Congé' | 'RTT'>;

export const requestableLeaveKinds = ['Congé', 'RTT'] as const satisfies readonly RequestableLeaveKind[];

export const absenceStatusLabels: Record<AbsenceStatus, string> = {
	pending: 'En attente',
	approved: 'Accepté',
	declined: 'Refusé'
};

/** Un congé demandé : du premier au dernier jour compris. */
export type LeaveRequest = {
	id: string;
	employeeId: string;
	firstDate: string;
	lastDate: string;
	kind: AbsenceKind;
	status: AbsenceStatus;
	note: string;
};

/** Au-delà, la demande se discute de vive voix : cinq semaines, le congé annuel entier. */
export const maximumLeaveDays = 35;

export function countLeaveDays(leave: Pick<LeaveRequest, 'firstDate' | 'lastDate'>): number {
	const millisecondsPerDay = 24 * 60 * 60 * 1000;
	return (Date.parse(`${leave.lastDate}T00:00:00Z`) - Date.parse(`${leave.firstDate}T00:00:00Z`)) / millisecondsPerDay + 1;
}

/** Deux demandes qui partagent au moins un jour. */
export function doLeavesOverlap(
	first: Pick<LeaveRequest, 'firstDate' | 'lastDate'>,
	second: Pick<LeaveRequest, 'firstDate' | 'lastDate'>
): boolean {
	return first.firstDate <= second.lastDate && second.firstDate <= first.lastDate;
}

/** « Congé du lundi 2 novembre au vendredi 6 novembre », « RTT le mardi 3 novembre ». */
export function describeLeave(leave: Pick<LeaveRequest, 'kind' | 'firstDate' | 'lastDate'>): string {
	if (leave.firstDate === leave.lastDate) return `${leave.kind} le ${formatLongDate(leave.firstDate)}`;
	return `${leave.kind} du ${formatLongDate(leave.firstDate)} au ${formatLongDate(leave.lastDate)}`;
}

function formatLongDate(isoDate: string): string {
	return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('fr-FR', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		timeZone: 'UTC'
	});
}

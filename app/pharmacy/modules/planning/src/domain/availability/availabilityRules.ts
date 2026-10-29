import { toMinutesSinceMidnight } from '../planning';
import type { AvailabilityValidation } from '../rules/employeeTerms';

/** Indisponible : absolue. Cours : un étudiant n'y est pas non plus. Disponible : ce que l'employé propose en plus. */
export type AvailabilityKind = 'unavailable' | 'course' | 'available';

export type AvailabilityStatus = 'pending' | 'approved' | 'declined';

export const availabilityKinds = ['unavailable', 'course', 'available'] as const satisfies readonly AvailabilityKind[];

export const availabilityKindLabels: Record<AvailabilityKind, string> = {
	unavailable: 'Indisponible',
	course: 'Cours',
	available: 'Disponible'
};

/** `weekday` (0 = lundi) pour une règle qui revient chaque semaine, `date` pour un jour précis : jamais les deux. */
export type AvailabilityRule = {
	id: string;
	employeeId: string;
	kind: AvailabilityKind;
	weekday: number | undefined;
	date: string | undefined;
	startTime: string;
	endTime: string;
	status: AvailabilityStatus;
	note: string;
};

const weekdayNames = ['lundis', 'mardis', 'mercredis', 'jeudis', 'vendredis', 'samedis', 'dimanches'];

export function getWeekdayIndexOfDate(isoDate: string): number {
	return (new Date(`${isoDate}T00:00:00Z`).getUTCDay() + 6) % 7;
}

export function doesRuleApplyOnDate(rule: AvailabilityRule, isoDate: string): boolean {
	return rule.date === undefined ? rule.weekday === getWeekdayIndexOfDate(isoDate) : rule.date === isoDate;
}

const blockingKinds: readonly AvailabilityKind[] = ['unavailable', 'course'];

/** La règle validée qui interdit ce créneau à cet employé, s'il y en a une. */
export function findBlockingRule(
	rules: readonly AvailabilityRule[],
	employeeId: string,
	isoDate: string,
	startTime: string,
	endTime: string
): AvailabilityRule | undefined {
	const shiftStart = toMinutesSinceMidnight(startTime);
	const shiftEnd = toMinutesSinceMidnight(endTime);
	return rules.find(
		(rule) =>
			rule.employeeId === employeeId &&
			rule.status === 'approved' &&
			blockingKinds.includes(rule.kind) &&
			doesRuleApplyOnDate(rule, isoDate) &&
			toMinutesSinceMidnight(rule.startTime) < shiftEnd &&
			shiftStart < toMinutesSinceMidnight(rule.endTime)
	);
}

/** Un titulaire n'a pas à se valider lui-même ; un employé est validé selon son contrat. */
export function decideInitialStatus(validation: AvailabilityValidation, isSubmittedByManager: boolean): AvailabilityStatus {
	return isSubmittedByManager || validation === 'automatic' ? 'approved' : 'pending';
}

export function describeRuleRecurrence(rule: Pick<AvailabilityRule, 'weekday' | 'date'>): string {
	if (rule.date !== undefined) {
		return `le ${new Date(`${rule.date}T00:00:00Z`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })}`;
	}
	return `tous les ${weekdayNames[rule.weekday ?? 0]}`;
}

export function describeAvailabilityRule(rule: AvailabilityRule): string {
	return `${availabilityKindLabels[rule.kind]} ${describeRuleRecurrence(rule)}, de ${rule.startTime} à ${rule.endTime}`;
}

import type { DayStatus, EmployeeAssessment, EmployeeHoursStatus } from '../../../domain/live/liveWeek';
import { formatEurosFromCents, sumOvertimeMinutes, type OvertimeRules } from '../../../domain/overtime/overtimePay';
import { formatDuration } from '../../../domain/planning';

export const weekCalendarHourHeightPixels = 52;

export const dayStatusClasses: Record<DayStatus, string> = {
	ok: 'bg-success-soft text-success',
	alert: 'bg-danger-soft text-danger',
	notice: 'bg-warning-soft text-warning',
	closed: 'bg-surface-muted text-ink-subtle',
	past: 'bg-surface-subtle text-ink-subtle'
};

export const hoursStatusClasses: Record<EmployeeHoursStatus, string> = {
	ok: 'text-ink-subtle',
	short: 'font-semibold text-danger',
	over: 'font-semibold text-danger'
};

export const hoursStatusLabels: Record<EmployeeHoursStatus, string> = {
	ok: '',
	short: 'sous son contrat',
	over: 'trop d’heures'
};

/** « 3 h à 25 %, 1 h à 50 % · prochaine heure à 20,00 € », ou `undefined` sans heure supplémentaire. */
export function describeEmployeeOvertime(employee: EmployeeAssessment, overtimeRules: OvertimeRules): string | undefined {
	const { firstBandMinutes, beyondMinutes } = employee.overtime;
	if (sumOvertimeMinutes(employee.overtime) === 0) return undefined;
	const bands = [
		firstBandMinutes > 0 ? `${formatDuration(firstBandMinutes)} à ${overtimeRules.firstBandRatePercent} %` : undefined,
		beyondMinutes > 0 ? `${formatDuration(beyondMinutes)} à ${overtimeRules.beyondRatePercent} %` : undefined
	].filter((band) => band !== undefined);
	const nextHourRate = employee.nextHourRateCents === undefined ? '' : ` · prochaine heure à ${formatEurosFromCents(employee.nextHourRateCents)}`;
	return `Heures supplémentaires : ${bands.join(', ')}${nextHourRate}`;
}

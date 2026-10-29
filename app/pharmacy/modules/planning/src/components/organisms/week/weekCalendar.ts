import type { DayStatus, EmployeeHoursStatus } from '../../../domain/live/liveWeek';

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

import { addDays, getIsoWeek, toIsoDate } from '../calendar/week';
import { getWeekdayIndexOfDate } from '../availability/availabilityRules';
import type { Shift } from '../planning';

/** Deux semaines types qui s'alternent : A les semaines impaires, B les paires. */
export type TemplateRotation = 'A' | 'B';

export type WeekTemplateShift = {
	employeeId: string;
	/** 0 = lundi. */
	weekday: number;
	startTime: string;
	endTime: string;
};

export type WeekTemplate = {
	id: string;
	name: string;
	/** `undefined` : la même semaine type toutes les semaines. */
	rotation: TemplateRotation | undefined;
	shifts: WeekTemplateShift[];
};

export function getRotationOfWeek(monday: Date): TemplateRotation {
	return getIsoWeek(monday).weekNumber % 2 === 1 ? 'A' : 'B';
}

/** La semaine type qui revient à cette semaine : celle de sa rotation, sinon la première sans rotation. */
export function pickTemplateForWeek(templates: readonly WeekTemplate[], monday: Date): WeekTemplate | undefined {
	const rotation = getRotationOfWeek(monday);
	return templates.find((template) => template.rotation === rotation) ?? templates.find((template) => template.rotation === undefined);
}

export function toTemplateShifts(shifts: readonly Shift[]): WeekTemplateShift[] {
	return shifts.map((shift) => ({
		employeeId: shift.employeeId,
		weekday: getWeekdayIndexOfDate(shift.date),
		startTime: shift.startTime,
		endTime: shift.endTime
	}));
}

export function toShiftsOfWeek(template: WeekTemplate, monday: Date): Omit<Shift, 'id'>[] {
	return template.shifts.map((templateShift) => ({
		employeeId: templateShift.employeeId,
		date: toIsoDate(addDays(monday, templateShift.weekday)),
		startTime: templateShift.startTime,
		endTime: templateShift.endTime
	}));
}

export const rotationLabels: Record<TemplateRotation | 'none', string> = {
	none: 'Toutes les semaines',
	A: 'Semaines A (impaires)',
	B: 'Semaines B (paires)'
};

export type WeekTemplateSummary = { id: string; name: string; rotationLabel: string; shiftCount: number };

export function summarizeWeekTemplate(template: WeekTemplate): WeekTemplateSummary {
	return {
		id: template.id,
		name: template.name,
		rotationLabel: rotationLabels[template.rotation ?? 'none'],
		shiftCount: template.shifts.length
	};
}

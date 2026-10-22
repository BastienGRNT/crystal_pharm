export type Employee = {
	id: string;
	fullName: string;
	jobTitle: string;
	isPharmacist: boolean;
};

export type Shift = {
	id: string;
	employeeId: string;
	date: string;
	startTime: string;
	endTime: string;
};

export type AbsenceKind = 'Congé' | 'RTT' | 'Arrêt maladie' | 'Autre';

export type Absence = {
	id: string;
	employeeId: string;
	firstDate: string;
	lastDate: string;
	kind: AbsenceKind;
};

export type WeekPlanning = {
	employees: Employee[];
	shifts: Shift[];
	absences: Absence[];
};

export type PlanningCell = {
	date: string;
	absenceKind: AbsenceKind | undefined;
	shifts: Shift[];
};

export type PlanningRow = {
	employee: Employee;
	cells: PlanningCell[];
};

export function formatShiftHours(shift: Shift): string {
	return `${shift.startTime}–${shift.endTime}`;
}

export function toMinutesSinceMidnight(time: string): number {
	const [hours = 0, minutes = 0] = time.split(':').map(Number);
	return hours * 60 + minutes;
}

export function sumPlannedMinutes(shifts: Shift[]): number {
	return shifts.reduce(
		(total, shift) => total + toMinutesSinceMidnight(shift.endTime) - toMinutesSinceMidnight(shift.startTime),
		0
	);
}

// Insécable : « 8 h » ne doit jamais se couper entre le nombre et l'unité.
const nonBreakingSpace = '\u00a0';

/** « 168 h », « 7 h 30 » : une durée comme on la dit. */
export function formatDuration(totalMinutes: number): string {
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	const hoursText = `${hours}${nonBreakingSpace}h`;
	return minutes === 0 ? hoursText : `${hoursText}${nonBreakingSpace}${String(minutes).padStart(2, '0')}`;
}

/** Une ligne par employé, une cellule par jour : l'absence du jour, sinon ses créneaux dans l'ordre de la journée. */
export function buildPlanningRows(weekPlanning: WeekPlanning, weekDates: string[]): PlanningRow[] {
	return weekPlanning.employees.map((employee) => ({
		employee,
		cells: weekDates.map((date) => buildPlanningCell(weekPlanning, employee.id, date))
	}));
}

function buildPlanningCell(weekPlanning: WeekPlanning, employeeId: string, date: string): PlanningCell {
	const absence = weekPlanning.absences.find(
		(candidate) =>
			candidate.employeeId === employeeId && candidate.firstDate <= date && date <= candidate.lastDate
	);
	const shifts = weekPlanning.shifts
		.filter((shift) => shift.employeeId === employeeId && shift.date === date)
		.sort((first, second) => first.startTime.localeCompare(second.startTime));
	return { date, absenceKind: absence?.kind, shifts };
}

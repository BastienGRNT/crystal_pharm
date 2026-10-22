import { describe, expect, it } from 'vitest';
import { buildPlanningRows, formatDuration, formatShiftHours, sumPlannedMinutes, type WeekPlanning } from './planning';

const weekPlanning: WeekPlanning = {
	employees: [{ id: 'employee-1', fullName: 'Hélène Dubois', jobTitle: 'Titulaire', isPharmacist: true }],
	shifts: [
		{ id: 'shift-2', employeeId: 'employee-1', date: '2026-09-28', startTime: '14:00', endTime: '19:30' },
		{ id: 'shift-1', employeeId: 'employee-1', date: '2026-09-28', startTime: '08:30', endTime: '12:30' }
	],
	absences: [
		{ id: 'absence-1', employeeId: 'employee-1', firstDate: '2026-09-29', lastDate: '2026-09-30', kind: 'RTT' }
	]
};

describe('buildPlanningRows', () => {
	const [row] = buildPlanningRows(weekPlanning, ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01']);

	it('range les créneaux du jour dans l’ordre de la journée', () => {
		expect(row?.cells[0]?.shifts.map(formatShiftHours)).toEqual(['08:30–12:30', '14:00–19:30']);
	});

	it('marque chaque jour couvert par une absence, bornes comprises', () => {
		expect(row?.cells.map((cell) => cell.absenceKind)).toEqual([undefined, 'RTT', 'RTT', undefined]);
	});
});

describe('durée planifiée', () => {
	it('additionne la durée des créneaux', () => {
		expect(sumPlannedMinutes(weekPlanning.shifts)).toBe(9 * 60 + 30);
	});

	it('écrit une durée comme on la dit', () => {
		expect(formatDuration(168 * 60)).toBe('168 h');
		expect(formatDuration(9 * 60 + 30)).toBe('9 h 30');
		expect(formatDuration(65)).toBe('1 h 05');
	});
});

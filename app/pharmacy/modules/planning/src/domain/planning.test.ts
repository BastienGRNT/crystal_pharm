import { describe, expect, it } from 'vitest';
import {
	buildPlanningRows,
	findOverlappingShift,
	formatDuration,
	formatShiftHours,
	isPharmacistJobTitle,
	sumPlannedMinutes,
	type WeekPlanning
} from './planning';

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
		expect(formatDuration(168 * 60)).toBe('168\u00a0h');
		expect(formatDuration(9 * 60 + 30)).toBe('9\u00a0h\u00a030');
		expect(formatDuration(65)).toBe('1\u00a0h\u00a005');
	});
});

describe('isPharmacistJobTitle', () => {
	it('reconnaît un pharmacien à son poste, quels que soient le genre, les accents et les majuscules', () => {
		expect(
			['Pharmacienne titulaire', 'Pharmacien adjoint', 'Titulaire', 'PHARMACIENNE ADJOINTE'].map(isPharmacistJobTitle)
		).toEqual([true, true, true, true]);
	});

	it('ne compte ni les préparateurs ni les étudiants en pharmacie', () => {
		expect(['Préparatrice', 'Apprenti préparateur', 'Étudiante en pharmacie', 'Rayonniste'].map(isPharmacistJobTitle)).toEqual(
			[false, false, false, false]
		);
	});
});

describe('findOverlappingShift', () => {
	const morningShift = weekPlanning.shifts[1];

	it('trouve le créneau du même employé qui empiète sur le nouveau', () => {
		const newShift = { employeeId: 'employee-1', date: '2026-09-28', startTime: '12:00', endTime: '13:00' };
		expect(findOverlappingShift(weekPlanning.shifts, newShift)).toEqual(morningShift);
	});

	it('accepte un créneau qui touche un autre sans le chevaucher', () => {
		const newShift = { employeeId: 'employee-1', date: '2026-09-28', startTime: '12:30', endTime: '14:00' };
		expect(findOverlappingShift(weekPlanning.shifts, newShift)).toBeUndefined();
	});

	it('ignore les créneaux d’un autre jour ou d’un autre employé', () => {
		const otherDay = { employeeId: 'employee-1', date: '2026-09-29', startTime: '09:00', endTime: '10:00' };
		const otherEmployee = { employeeId: 'employee-2', date: '2026-09-28', startTime: '09:00', endTime: '10:00' };
		expect(findOverlappingShift(weekPlanning.shifts, otherDay)).toBeUndefined();
		expect(findOverlappingShift(weekPlanning.shifts, otherEmployee)).toBeUndefined();
	});
});

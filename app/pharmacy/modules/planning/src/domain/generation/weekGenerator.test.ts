import { describe, expect, it } from 'vitest';
import { detectPlanningIssues } from '../issues/planningIssues';
import { defaultPlanningRules } from '../rules/planningRules';
import type { Employee } from '../planning';
import { generateWeek } from './weekGenerator';
import type { GenerationEmployee, GenerationInput } from './generationTypes';

const weekDates = ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01'];
const workingDay = [
	{ opensAt: '09:00', closesAt: '12:30' },
	{ opensAt: '14:00', closesAt: '19:30' }
];

const person = (id: string, overrides: Partial<GenerationEmployee> = {}): GenerationEmployee => ({
	id,
	fullName: id,
	isPharmacist: false,
	isStudent: false,
	isPlannedManually: false,
	weeklyContractMinutes: undefined,
	hourlyRateCents: 1500,
	...overrides
});

const buildInput = (employees: GenerationEmployee[], overrides: Partial<GenerationInput> = {}): GenerationInput => ({
	weekDates,
	firstEditableDate: weekDates[0] ?? '',
	openingPeriodsByDate: weekDates.map((_, index) => (index < 5 ? workingDay : [])),
	requirementWindowsByDate: weekDates.map(() => []),
	rules: defaultPlanningRules,
	employees,
	absences: [],
	availabilityRules: [],
	existingShifts: [],
	...overrides
});

const toIssues = (input: GenerationInput, result: ReturnType<typeof generateWeek>) => {
	const planningEmployees: Employee[] = input.employees.map((employee) => ({
		id: employee.id,
		fullName: employee.fullName,
		jobTitle: employee.isPharmacist ? 'Pharmacien' : 'Préparateur',
		isPharmacist: employee.isPharmacist
	}));
	return detectPlanningIssues({
		weekPlanning: {
			employees: planningEmployees,
			shifts: [...input.existingShifts, ...result.proposedShifts.map((shift, index) => ({ id: String(index), ...shift }))],
			absences: input.absences
		},
		weekDates: input.weekDates,
		openingPeriodsByDate: input.openingPeriodsByDate,
		requirementWindowsByDate: input.requirementWindowsByDate,
		rules: input.rules,
		termsByEmployee: new Map(),
		availabilityRules: input.availabilityRules
	}).filter((issue) => issue.kind === 'not-enough-pharmacists' || issue.kind === 'not-enough-people');
};

describe('generateWeek', () => {
	const team = [
		person('pharmacien-1', { isPharmacist: true, weeklyContractMinutes: 35 * 60, hourlyRateCents: 3200 }),
		person('pharmacien-2', { isPharmacist: true, weeklyContractMinutes: 28 * 60, hourlyRateCents: 2600 }),
		person('preparateur', { weeklyContractMinutes: 35 * 60, hourlyRateCents: 1650 }),
		person('etudiant', { isStudent: true, hourlyRateCents: 950 })
	];

	it('couvre l’ouverture avec un pharmacien et l’effectif minimal', () => {
		const input = buildInput(team);
		expect(toIssues(input, generateWeek(input))).toEqual([]);
	});

	it('ne pose rien sur un employé absent, indisponible ou en cours', () => {
		const input = buildInput(team, {
			absences: [{ id: 'a', employeeId: 'pharmacien-1', firstDate: '2026-10-26', lastDate: '2026-10-28', kind: 'Congé' }],
			availabilityRules: [
				{ id: 'r', employeeId: 'etudiant', kind: 'course', weekday: 0, date: undefined, startTime: '09:00', endTime: '19:30', status: 'approved', note: '' }
			]
		});
		const { proposedShifts } = generateWeek(input);
		expect(proposedShifts.some((shift) => shift.employeeId === 'pharmacien-1' && shift.date <= '2026-10-28')).toBe(false);
		expect(proposedShifts.some((shift) => shift.employeeId === 'etudiant' && shift.date === '2026-10-26')).toBe(false);
	});

	it('signale la plage sans pharmacien quand tous sont indisponibles', () => {
		const input = buildInput([person('preparateur'), person('pharmacien', { isPharmacist: true })], {
			availabilityRules: [
				{ id: 'r', employeeId: 'pharmacien', kind: 'unavailable', weekday: 1, date: undefined, startTime: '14:00', endTime: '19:30', status: 'approved', note: '' }
			]
		});
		const { gaps } = generateWeek(input);
		expect(gaps.some((gap) => gap.kind === 'pharmacist' && gap.date === '2026-10-27' && gap.startMinutes === 14 * 60)).toBe(true);
	});

	it('respecte durée minimale, plages par jour et repos', () => {
		const input = buildInput(team);
		const { proposedShifts } = generateWeek(input);
		for (const shift of proposedShifts) {
			const [startHours = 0, startMinutes = 0] = shift.startTime.split(':').map(Number);
			const [endHours = 0, endMinutes = 0] = shift.endTime.split(':').map(Number);
			expect(endHours * 60 + endMinutes - (startHours * 60 + startMinutes)).toBeGreaterThanOrEqual(120);
		}
		const countByEmployeeAndDay = new Map<string, number>();
		for (const shift of proposedShifts) {
			const key = `${shift.employeeId}-${shift.date}`;
			countByEmployeeAndDay.set(key, (countByEmployeeAndDay.get(key) ?? 0) + 1);
		}
		for (const count of countByEmployeeAndDay.values()) expect(count).toBeLessThanOrEqual(2);
	});

	it('préfère les heures du contrat au tarif le plus bas, puis le moins cher', () => {
		const input = buildInput([
			person('salarie', { weeklyContractMinutes: 20 * 60, hourlyRateCents: 2000 }),
			person('etudiant', { isStudent: true, hourlyRateCents: 900 })
		]);
		const { proposedShifts } = generateWeek(input);
		const salarieMinutes = proposedShifts.filter((shift) => shift.employeeId === 'salarie').length;
		expect(salarieMinutes).toBeGreaterThan(0);
	});

	it('met l’étudiant sur la pointe quand le contrat est déjà rempli', () => {
		const input = buildInput(
			[
				person('pharmacien', { isPharmacist: true, weeklyContractMinutes: 35 * 60, hourlyRateCents: 3200 }),
				person('salarie', { weeklyContractMinutes: 1, hourlyRateCents: 2000 }),
				person('etudiant', { isStudent: true, hourlyRateCents: 900 })
			],
			{
				requirementWindowsByDate: weekDates.map((_, index) => (index === 0 ? [{ startMinutes: 17 * 60, endMinutes: 19 * 60, requiredCount: 3 }] : []))
			}
		);
		const { proposedShifts } = generateWeek(input);
		const mondayEvening = proposedShifts.filter((shift) => shift.date === '2026-10-26' && shift.endTime >= '19:00');
		expect(mondayEvening.some((shift) => shift.employeeId === 'etudiant')).toBe(true);
	});

	it('garde les créneaux existants et ne comble que le manque', () => {
		const existingShifts = weekDates.slice(0, 5).flatMap((date, index) => [
			{ id: `m${index}`, employeeId: 'pharmacien-1', date, startTime: '09:00', endTime: '12:30' },
			{ id: `a${index}`, employeeId: 'pharmacien-1', date, startTime: '14:00', endTime: '19:30' }
		]);
		const input = buildInput(team, { existingShifts });
		const { proposedShifts } = generateWeek(input);
		expect(proposedShifts.every((shift) => shift.employeeId !== 'pharmacien-1' || shift.date > '2026-10-30')).toBe(true);
	});

	it('explique chaque créneau proposé', () => {
		const { proposedShifts } = generateWeek(buildInput(team));
		expect(proposedShifts.length).toBeGreaterThan(0);
		expect(proposedShifts.every((shift) => shift.reason.includes(':'))).toBe(true);
	});
});

describe('semaine en cours', () => {
	it('ne touche à aucun jour déjà passé', () => {
		const team = [person('pharmacien-1', { isPharmacist: true, weeklyContractMinutes: 35 * 60 }), person('salarie', { weeklyContractMinutes: 20 * 60 })];
		const { proposedShifts, extendedShifts } = generateWeek(buildInput(team, { firstEditableDate: '2026-10-28' }));
		expect(proposedShifts.length).toBeGreaterThan(0);
		expect([...proposedShifts, ...extendedShifts].every((shift) => shift.date >= '2026-10-28')).toBe(true);
	});

	it('ne place jamais quelqu’un qui pose ses horaires lui-même', () => {
		const team = [person('titulaire', { isPharmacist: true, isPlannedManually: true, weeklyContractMinutes: 35 * 60 }), person('adjoint', { isPharmacist: true })];
		const { proposedShifts } = generateWeek(buildInput(team));
		expect(proposedShifts.some((shift) => shift.employeeId === 'titulaire')).toBe(false);
	});

	it('allonge un créneau existant plutôt que d’en ajouter un', () => {
		const team = [person('pharmacien-1', { isPharmacist: true, weeklyContractMinutes: 30 * 60 })];
		const existingShifts = [{ id: 'existant', employeeId: 'pharmacien-1', date: '2026-10-26', startTime: '14:00', endTime: '17:30' }];
		const { extendedShifts } = generateWeek(buildInput(team, { existingShifts }));
		expect(extendedShifts.some((shift) => shift.shiftId === 'existant' && shift.endTime > '17:30')).toBe(true);
	});
});

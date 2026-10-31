import { describe, expect, it } from 'vitest';
import type { GenerationEmployee, GenerationInput } from '../generation/generationTypes';
import { collectiveAgreementOvertimeRules } from '../overtime/overtimePay';
import { defaultPlanningRules } from '../rules/planningRules';
import { assessLeaveStaffingImpact } from './leaveStaffingImpact';

const weekDates = ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08'];
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

const buildWeek = (employees: GenerationEmployee[], overrides: Partial<GenerationInput> = {}): GenerationInput => ({
	weekDates,
	firstEditableDate: weekDates[0] ?? '',
	openingPeriodsByDate: weekDates.map((_, index) => (index < 5 ? workingDay : [])),
	requirementWindowsByDate: weekDates.map(() => []),
	rules: defaultPlanningRules,
	overtimeRules: collectiveAgreementOvertimeRules,
	employees,
	absences: [],
	availabilityRules: [],
	existingShifts: [],
	plannedActivities: [],
	...overrides
});

const leaveOf = (employeeId: string, firstDate: string, lastDate: string) => ({ employeeId, firstDate, lastDate, kind: 'Congé' as const });

describe('assessLeaveStaffingImpact', () => {
	it('dit l’équipe suffisante quand un collègue peut prendre la relève', () => {
		const team = [
			person('pharmacien-1', { isPharmacist: true }),
			person('pharmacien-2', { isPharmacist: true }),
			person('preparateur-1'),
			person('preparateur-2')
		];
		const impact = assessLeaveStaffingImpact([buildWeek(team)], leaveOf('pharmacien-1', '2026-11-03', '2026-11-03'));
		expect(impact).toEqual({ isTeamSufficient: true, shortages: [] });
	});

	it('montre où il manquerait un pharmacien quand le seul s’absente', () => {
		const team = [person('pharmacien', { isPharmacist: true }), person('preparateur-1'), person('preparateur-2')];
		const impact = assessLeaveStaffingImpact([buildWeek(team)], leaveOf('pharmacien', '2026-11-03', '2026-11-03'));
		expect(impact.isTeamSufficient).toBe(false);
		expect(impact.shortages.every((shortage) => shortage.date === '2026-11-03' && shortage.kind === 'pharmacist')).toBe(true);
		expect(impact.shortages[0]?.message).toContain('il manquerait un pharmacien de 09:00 à 12:30');
	});

	it('ne reproche pas au congé un trou qui existait déjà', () => {
		const team = [
			person('pharmacien-1', { isPharmacist: true }),
			person('pharmacien-2', { isPharmacist: true }),
			person('preparateur')
		];
		const unavailableEveryWednesday = {
			id: 'r',
			employeeId: 'pharmacien-2',
			kind: 'unavailable' as const,
			weekday: 2,
			date: undefined,
			startTime: '09:00',
			endTime: '19:30',
			status: 'approved' as const,
			note: ''
		};
		const week = buildWeek(team, { availabilityRules: [unavailableEveryWednesday], rules: { ...defaultPlanningRules, minimumPeoplePresent: 1 } });
		const impact = assessLeaveStaffingImpact([week], leaveOf('preparateur', '2026-11-02', '2026-11-06'));
		expect(impact.isTeamSufficient).toBe(true);
	});

	it('ignore les créneaux de la personne pendant le congé, et seulement ceux-là', () => {
		const team = [person('pharmacien', { isPharmacist: true }), person('preparateur-1'), person('preparateur-2')];
		const week = buildWeek(team, {
			existingShifts: [{ id: 's', employeeId: 'pharmacien', date: '2026-11-04', startTime: '09:00', endTime: '12:30' }]
		});
		const impact = assessLeaveStaffingImpact([week], leaveOf('pharmacien', '2026-11-04', '2026-11-04'));
		expect(impact.shortages.some((shortage) => shortage.date === '2026-11-04' && shortage.startMinutes === 9 * 60)).toBe(true);
	});
});

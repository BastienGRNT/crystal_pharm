import { describe, expect, it } from 'vitest';
import { formatDuration, type Employee, type Shift, type WeekPlanning } from '../planning';
import { buildDefaultEmployeeTerms, type EmployeeTerms } from '../rules/employeeTerms';
import { defaultPlanningRules } from '../rules/planningRules';
import { detectPlanningIssues, type PlanningIssueInput } from './planningIssues';

const weekDates = ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25'];
const pharmacist: Employee = { id: 'ph', fullName: 'Hélène Dubois', jobTitle: 'Pharmacienne', isPharmacist: true };
const assistant: Employee = { id: 'as', fullName: 'Léa Martin', jobTitle: 'Préparatrice', isPharmacist: false };

const shift = (employeeId: string, date: string, startTime: string, endTime: string): Shift => ({
	id: `${employeeId}-${date}-${startTime}`,
	employeeId,
	date,
	startTime,
	endTime
});

const openOnMondayFrom9To19 = weekDates.map((_, dayIndex) =>
	dayIndex === 0 ? [{ opensAt: '09:00', closesAt: '19:00' }] : []
);

function buildInput(weekPlanning: WeekPlanning, termsList: EmployeeTerms[] = []): PlanningIssueInput {
	return {
		weekPlanning,
		weekDates,
		openingPeriodsByDate: openOnMondayFrom9To19,
		requirementWindowsByDate: weekDates.map(() => []),
		rules: { ...defaultPlanningRules, minimumPeoplePresent: 2 },
		termsByEmployee: new Map(termsList.map((terms) => [terms.employeeId, terms])),
		availabilityRules: []
	};
}

describe('detectPlanningIssues', () => {
	it('alerte quand il manque un pharmacien ou du monde au comptoir', () => {
		const issues = detectPlanningIssues(
			buildInput({
				employees: [pharmacist, assistant],
				shifts: [shift('ph', '2026-10-19', '09:00', '14:00'), shift('as', '2026-10-19', '09:00', '19:00')],
				absences: []
			})
		);
		expect(issues.map((issue) => issue.kind)).toEqual(['not-enough-pharmacists', 'not-enough-people']);
		expect(issues[0]?.message).toContain('de 14:00 à 19:00');
	});

	it('ne dit rien d’un jour fermé', () => {
		const issues = detectPlanningIssues(
			buildInput({ employees: [pharmacist], shifts: [shift('ph', '2026-10-20', '09:00', '12:00')], absences: [] })
		);
		expect(issues.filter((issue) => issue.date === '2026-10-20')).toEqual([]);
	});

	it('signale une plage trop courte et trop de plages dans la journée', () => {
		const issues = detectPlanningIssues(
			buildInput({
				employees: [pharmacist, assistant],
				shifts: [
					shift('ph', '2026-10-19', '09:00', '19:00'),
					shift('as', '2026-10-19', '09:00', '10:00'),
					shift('as', '2026-10-19', '12:00', '19:00'),
					shift('as', '2026-10-19', '19:00', '20:00')
				],
				absences: []
			})
		);
		expect(issues.map((issue) => issue.kind).sort()).toEqual([
			'not-enough-people',
			'shift-too-short',
			'shift-too-short',
			'too-many-shifts'
		]);
	});

	it('signale un employé prévu pendant son absence', () => {
		const issues = detectPlanningIssues(
			buildInput({
				employees: [pharmacist, assistant],
				shifts: [shift('as', '2026-10-19', '09:00', '19:00'), shift('ph', '2026-10-19', '09:00', '19:00')],
				absences: [{ id: 'a', employeeId: 'as', firstDate: '2026-10-19', lastDate: '2026-10-19', kind: 'Congé' }]
			})
		);
		expect(issues.map((issue) => issue.kind)).toContain('employee-on-absence');
	});

	it('remarque un contrat dont les heures ne sont pas atteintes', () => {
		const issues = detectPlanningIssues(
			buildInput(
				{ employees: [assistant], shifts: [shift('as', '2026-10-20', '09:00', '13:00')], absences: [] },
				[{ ...buildDefaultEmployeeTerms('as'), weeklyContractMinutes: 20 * 60 }]
			)
		);
		expect(issues.find((issue) => issue.kind === 'contract-hours-short')?.message).toContain(`${formatDuration(4 * 60)} planifiées sur ${formatDuration(20 * 60)}`);
	});
});

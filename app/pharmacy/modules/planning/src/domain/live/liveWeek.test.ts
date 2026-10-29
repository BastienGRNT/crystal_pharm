import { describe, expect, it } from 'vitest';
import { defaultPlanningRules } from '../rules/planningRules';
import { applyShiftPreview, assessWeek, type LiveWeekInput } from './liveWeek';

const weekDates = ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01'];

const input: LiveWeekInput = {
	weekDates,
	firstEditableDate: '2026-10-26',
	employees: [
		{ id: 'pharmacien', fullName: 'Pharma Cien', jobTitle: 'Pharmacien', isPharmacist: true },
		{ id: 'preparateur', fullName: 'Prépa Rateur', jobTitle: 'Préparateur', isPharmacist: false }
	],
	shifts: [{ id: 's1', employeeId: 'pharmacien', date: '2026-10-26', startTime: '09:00', endTime: '19:00' }],
	absences: [],
	openingPeriodsByDate: weekDates.map((_, index) => (index === 0 ? [{ opensAt: '09:00', closesAt: '19:00' }] : [])),
	requirementWindowsByDate: weekDates.map(() => []),
	rules: { ...defaultPlanningRules, minimumPeoplePresent: 1, minimumPharmacistsPresent: 1 },
	terms: [{ employeeId: 'pharmacien', weeklyContractMinutes: 10 * 60, hourlyRateCents: undefined, isStudent: false, isPlannedManually: false, availabilityValidation: 'manual' }],
	availabilityRules: []
};

describe('assessWeek', () => {
	it('juge la journée bonne quand tout est couvert', () => {
		const assessment = assessWeek(input);
		expect(assessment.days[0]?.status).toBe('ok');
		expect(assessment.days[1]?.status).toBe('closed');
		expect(assessment.employees.find((employee) => employee.employeeId === 'pharmacien')?.status).toBe('ok');
	});

	it('passe la journée en alerte dès qu’on raccourcit le créneau du seul pharmacien', () => {
		const assessment = assessWeek(input, { shiftId: 's1', employeeId: 'pharmacien', date: '2026-10-26', startTime: '09:00', endTime: '17:00' });
		expect(assessment.days[0]?.status).toBe('alert');
		expect(assessment.days[0]?.pharmacistCoverage.some((segment) => !segment.isCovered)).toBe(true);
	});

	it('signale les heures sous le contrat et au-dessus', () => {
		const short = assessWeek(input, { shiftId: 's1', employeeId: 'pharmacien', date: '2026-10-26', startTime: '09:00', endTime: '15:00' });
		expect(short.employees[0]?.status).toBe('short');
		const over = assessWeek({ ...input, terms: [{ ...input.terms[0]!, weeklyContractMinutes: 5 * 60 }] });
		expect(over.employees[0]?.status).toBe('over');
	});

	it('ignore les alertes des jours passés', () => {
		const assessment = assessWeek({ ...input, firstEditableDate: '2026-10-27', shifts: [] });
		expect(assessment.days[0]?.status).toBe('past');
		expect(assessment.issues.some((issue) => issue.kind === 'not-enough-pharmacists')).toBe(false);
	});
});

describe('applyShiftPreview', () => {
	it('ajoute un créneau qu’on est en train de tracer', () => {
		expect(applyShiftPreview(input.shifts, { employeeId: 'preparateur', date: '2026-10-26', startTime: '10:00', endTime: '12:00' })).toHaveLength(2);
	});
});

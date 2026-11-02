import { describe, expect, it } from 'vitest';
import type { LiveWeekInput } from '../live/liveWeek';
import { collectiveAgreementOvertimeRules } from '../overtime/overtimePay';
import { defaultPlanningRules } from '../rules/planningRules';
import {
	buildPayrollRows,
	findPreviousPayrollMonth,
	formatDecimalHours,
	listMondaysOfPayrollMonth,
	parsePayrollMonth,
	renderPayrollCsv
} from './monthlyPayrollExport';
import { toIsoDate } from '../calendar/week';

const weekDates = ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01'];
const openOnWeekdays = weekDates.map((_, index) => (index < 6 ? [{ opensAt: '09:00', closesAt: '19:00' }] : []));

const buildWeek = (overrides: Partial<LiveWeekInput> = {}): LiveWeekInput => ({
	weekDates,
	firstEditableDate: weekDates[0] ?? '',
	employees: [
		{ id: 'lea', fullName: 'Léa Martin', jobTitle: 'Pharmacienne', isPharmacist: true },
		{ id: 'tom', fullName: 'Tom; "le jeune"', jobTitle: 'Préparateur', isPharmacist: false },
		{ id: 'absente', fullName: 'Nina Roux', jobTitle: 'Préparatrice', isPharmacist: false }
	],
	shifts: weekDates.slice(0, 5).map((date, index) => ({ id: `s${index}`, employeeId: 'lea', date, startTime: '08:00', endTime: '16:00' })),
	absences: [{ id: 'a1', employeeId: 'absente', firstDate: '2026-10-29', lastDate: '2026-11-02', kind: 'Congé' }],
	openingPeriodsByDate: openOnWeekdays,
	requirementWindowsByDate: weekDates.map(() => []),
	rules: defaultPlanningRules,
	overtimeRules: collectiveAgreementOvertimeRules,
	terms: [{ employeeId: 'lea', weeklyContractMinutes: 35 * 60, hourlyRateCents: 3250, isStudent: false, isPlannedManually: false, availabilityValidation: 'manual' }],
	availabilityRules: [],
	plannedActivities: [{ id: 'f1', employeeId: 'lea', kind: 'training', date: '2026-10-31', startTime: '09:00', endTime: '11:00', label: '' }],
	...overrides
});

describe('le mois de paie', () => {
	it('rattache chaque semaine au mois où elle se termine', () => {
		expect(listMondaysOfPayrollMonth({ year: 2026, month: 11 }).map(toIsoDate)).toEqual([
			'2026-10-26',
			'2026-11-02',
			'2026-11-09',
			'2026-11-16',
			'2026-11-23'
		]);
		expect(listMondaysOfPayrollMonth({ year: 2026, month: 10 }).map(toIsoDate).at(-1)).toBe('2026-10-19');
	});

	it('lit un mois et trouve le précédent', () => {
		expect(parsePayrollMonth('2026-10')).toEqual({ year: 2026, month: 10 });
		expect(parsePayrollMonth('2026-13')).toBeUndefined();
		expect(findPreviousPayrollMonth(new Date(Date.UTC(2026, 0, 15)))).toEqual({ year: 2025, month: 12 });
	});
});

describe('buildPayrollRows', () => {
	it('compte les heures, formations comprises, et les découpe en heures sup', () => {
		const [lea] = buildPayrollRows([buildWeek()]);
		expect(lea).toMatchObject({ employeeName: 'Léa Martin', workedMinutes: 42 * 60, regularMinutes: 35 * 60, firstBandMinutes: 7 * 60, beyondMinutes: 0 });
	});

	it('compte les absences en jours d’ouverture et omet qui n’a rien', () => {
		const rows = buildPayrollRows([buildWeek()]);
		expect(rows.map((row) => row.employeeName)).toEqual(['Léa Martin', 'Nina Roux']);
		expect(rows[1]?.absenceDaysByKind.get('Congé')).toBe(3);
	});
});

describe('renderPayrollCsv', () => {
	it('écrit un CSV français lisible par un tableur', () => {
		const csv = renderPayrollCsv(buildPayrollRows([buildWeek({ shifts: [{ id: 's', employeeId: 'tom', date: '2026-10-26', startTime: '09:00', endTime: '16:30' }] })]), collectiveAgreementOvertimeRules);
		const [header, firstLine] = csv.replace('﻿', '').split('\r\n');
		expect(csv.startsWith('﻿')).toBe(true);
		expect(header).toContain('Heures sup à 25 %;Heures sup à 50 %');
		expect(firstLine).toBe('Léa Martin;26/10/2026;01/11/2026;35;2;2;0;0;32,50;');
		expect(csv).toContain('"Tom; ""le jeune""";26/10/2026;01/11/2026;;7,5;7,5;0;0;;');
	});

	it('arrondit les heures à deux décimales', () => {
		expect(formatDecimalHours(20)).toBe('0,33');
	});
});

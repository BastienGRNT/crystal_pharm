import { sumTrainingMinutes } from '../activities/plannedActivities';
import { addDays, getMondayOfWeek } from '../calendar/week';
import type { LiveWeekInput } from '../live/liveWeek';
import { splitWeeklyOvertime, type OvertimeRules } from '../overtime/overtimePay';
import { sumPlannedMinutes, type AbsenceKind } from '../planning';
import { indexTermsByEmployee } from '../rules/employeeTerms';

/** Un mois de paie : `month` va de 1 (janvier) à 12. */
export type PayrollMonth = { year: number; month: number };

const payrollMonthPattern = /^(\d{4})-(\d{2})$/;

/** Lit « 2026-10 » ; `undefined` si ce n'est pas un mois. */
export function parsePayrollMonth(monthText: string): PayrollMonth | undefined {
	const match = monthText.match(payrollMonthPattern);
	if (!match) return undefined;
	const month = Number(match[2]);
	return month >= 1 && month <= 12 ? { year: Number(match[1]), month } : undefined;
}

export function formatPayrollMonthParameter({ year, month }: PayrollMonth): string {
	return `${year}-${String(month).padStart(2, '0')}`;
}

export function formatPayrollMonthLabel({ year, month }: PayrollMonth): string {
	return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** Le mois qui précède celui de `today` : celui que l'expert-comptable attend en début de mois. */
export function findPreviousPayrollMonth(today: Date): PayrollMonth {
	const firstOfPreviousMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
	return { year: firstOfPreviousMonth.getUTCFullYear(), month: firstOfPreviousMonth.getUTCMonth() + 1 };
}

/**
 * Les lundis des semaines rattachées au mois : celles qui se terminent dedans.
 * Les heures supplémentaires se comptent à la semaine : une semaine à cheval n'est jamais coupée en deux.
 */
export function listMondaysOfPayrollMonth({ year, month }: PayrollMonth): Date[] {
	const firstDay = new Date(Date.UTC(year, month - 1, 1));
	const lastDay = new Date(Date.UTC(year, month, 0));
	const firstSunday = addDays(getMondayOfWeek(firstDay), 6);
	const mondays: Date[] = [];
	for (let sunday = firstSunday; sunday <= lastDay; sunday = addDays(sunday, 7)) {
		if (sunday >= firstDay) mondays.push(addDays(sunday, -6));
	}
	return mondays;
}

export type PayrollRow = {
	employeeName: string;
	firstDate: string;
	lastDate: string;
	contractMinutes: number | undefined;
	workedMinutes: number;
	regularMinutes: number;
	firstBandMinutes: number;
	beyondMinutes: number;
	hourlyRateCents: number | undefined;
	/** Les jours d'ouverture manqués, par motif. */
	absenceDaysByKind: Map<AbsenceKind, number>;
};

/** Une ligne par personne et par semaine ; celles sans heure ni absence sont omises. */
export function buildPayrollRows(weeks: readonly LiveWeekInput[]): PayrollRow[] {
	return weeks.flatMap((week) => {
		const termsByEmployee = indexTermsByEmployee(
			week.employees.map((employee) => employee.id),
			week.terms
		);
		return week.employees.flatMap((employee): PayrollRow[] => {
			const terms = termsByEmployee.get(employee.id);
			const workedMinutes =
				sumPlannedMinutes(week.shifts.filter((shift) => shift.employeeId === employee.id)) +
				sumTrainingMinutes(week.plannedActivities, employee.id);
			const absenceDaysByKind = countAbsenceDaysByKind(week, employee.id);
			if (workedMinutes === 0 && absenceDaysByKind.size === 0) return [];
			return [
				{
					employeeName: employee.fullName,
					firstDate: week.weekDates[0] ?? '',
					lastDate: week.weekDates.at(-1) ?? '',
					contractMinutes: terms?.weeklyContractMinutes,
					workedMinutes,
					...splitWeeklyOvertime(workedMinutes, week.overtimeRules),
					hourlyRateCents: terms?.hourlyRateCents,
					absenceDaysByKind
				}
			];
		});
	});
}

function countAbsenceDaysByKind(week: LiveWeekInput, employeeId: string): Map<AbsenceKind, number> {
	const absenceDaysByKind = new Map<AbsenceKind, number>();
	week.weekDates.forEach((date, dayIndex) => {
		if ((week.openingPeriodsByDate[dayIndex] ?? []).length === 0) return;
		const absence = week.absences.find(
			(candidate) => candidate.employeeId === employeeId && candidate.firstDate <= date && date <= candidate.lastDate
		);
		if (absence) absenceDaysByKind.set(absence.kind, (absenceDaysByKind.get(absence.kind) ?? 0) + 1);
	});
	return absenceDaysByKind;
}

const csvSeparator = ';';
// Excel n'ouvre un CSV en UTF-8 (accents compris) qu'avec cette marque en tête.
const byteOrderMark = '﻿';

/** Le CSV attendu par un tableur français : `;` entre les colonnes, virgule décimale. */
export function renderPayrollCsv(rows: readonly PayrollRow[], overtimeRules: OvertimeRules): string {
	const header = [
		'Employé',
		'Semaine du',
		'Au',
		'Contrat (h/sem.)',
		'Heures travaillées',
		'Heures normales',
		`Heures sup à ${overtimeRules.firstBandRatePercent} %`,
		`Heures sup à ${overtimeRules.beyondRatePercent} %`,
		'Taux horaire (€)',
		'Absences (jours d’ouverture)'
	];
	const lines = rows.map((row) => [
		row.employeeName,
		formatFrenchDate(row.firstDate),
		formatFrenchDate(row.lastDate),
		row.contractMinutes === undefined ? '' : formatDecimalHours(row.contractMinutes),
		formatDecimalHours(row.workedMinutes),
		formatDecimalHours(row.regularMinutes),
		formatDecimalHours(row.firstBandMinutes),
		formatDecimalHours(row.beyondMinutes),
		row.hourlyRateCents === undefined ? '' : (row.hourlyRateCents / 100).toFixed(2).replace('.', ','),
		describeAbsenceDays(row.absenceDaysByKind)
	]);
	return byteOrderMark + [header, ...lines].map((cells) => cells.map(escapeCsvCell).join(csvSeparator)).join('\r\n') + '\r\n';
}

/** 450 minutes → « 7,5 » ; deux décimales au plus. */
export function formatDecimalHours(totalMinutes: number): string {
	return String(Math.round((totalMinutes / 60) * 100) / 100).replace('.', ',');
}

function formatFrenchDate(isoDate: string): string {
	const [year, month, day] = isoDate.split('-');
	return `${day}/${month}/${year}`;
}

function describeAbsenceDays(absenceDaysByKind: Map<AbsenceKind, number>): string {
	return [...absenceDaysByKind].map(([kind, dayCount]) => `${kind} : ${dayCount} j`).join(', ');
}

function escapeCsvCell(cell: string): string {
	return /[";\r\n]/.test(cell) ? `"${cell.replaceAll('"', '""')}"` : cell;
}

export function buildPayrollFileName(month: PayrollMonth): string {
	return `planning-${formatPayrollMonthParameter(month)}.csv`;
}

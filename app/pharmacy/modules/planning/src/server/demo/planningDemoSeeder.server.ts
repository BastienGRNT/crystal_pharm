import { listEmployees } from '@crystal-pharm/pharmacy-db';
import { addDays, getMondayOfWeek, toIsoDate } from '../../domain/calendar/week';
import { insertAvailabilityRule, type NewAvailabilityRule } from '../repositories/availabilityRuleRepository';
import { insertAbsence, insertShift } from '../repositories/planningRepository';
import { savePlannedWeekStatus } from '../repositories/plannedWeekRepository';
import { insertPeakWindow } from '../repositories/peakWindowRepository';
import { insertWeekTemplate } from '../repositories/weekTemplateRepository';
import { saveEmployeeTerms } from '../repositories/employeeTermsRepository';

type DemoShiftTemplate = { weekdayIndex: number; startTime: string; endTime: string };

const morning = (weekdayIndex: number): DemoShiftTemplate => ({ weekdayIndex, startTime: '09:00', endTime: '12:30' });
const afternoon = (weekdayIndex: number, endTime = '17:30'): DemoShiftTemplate => ({ weekdayIndex, startTime: '14:00', endTime });

const [monday, tuesday, wednesday, thursday, friday, saturday] = [0, 1, 2, 3, 4, 5];

// Volontairement troués : le jeudi soir sans personne, le mercredi soir avec une seule personne,
// les heures de Julien et d'Emma sous leur contrat, pour voir les alertes.
const demoWeekByFirstName: Record<string, DemoShiftTemplate[]> = {
	Léa: [monday, tuesday, thursday, friday].flatMap((day) => [morning(day), afternoon(day)]).concat(morning(saturday)),
	Thomas: [
		afternoon(monday, '19:30'),
		afternoon(tuesday, '19:30'),
		morning(wednesday),
		afternoon(wednesday, '19:30'),
		{ weekdayIndex: friday, startTime: '17:00', endTime: '19:30' }
	],
	Camille: [monday, tuesday, wednesday, thursday, friday].flatMap((day) => [morning(day), afternoon(day)]),
	Julien: [afternoon(monday, '19:30'), afternoon(tuesday, '19:30'), afternoon(friday, '19:30'), morning(saturday)],
	Emma: [morning(tuesday), morning(friday), morning(saturday)]
};

const demoTermsByFirstName: Record<string, { weeklyContractHours: number; hourlyRateEuros: number; isStudent: boolean; isPlannedManually?: boolean }> = {
	Léa: { weeklyContractHours: 35, hourlyRateEuros: 32, isStudent: false },
	Thomas: { weeklyContractHours: 28, hourlyRateEuros: 26, isStudent: false },
	Camille: { weeklyContractHours: 35, hourlyRateEuros: 16.5, isStudent: false },
	Julien: { weeklyContractHours: 24, hourlyRateEuros: 15.2, isStudent: false },
	Emma: { weeklyContractHours: 12, hourlyRateEuros: 9.5, isStudent: true }
};

const demoAvailabilityRulesByFirstName = (currentMonday: Date): Record<string, Omit<NewAvailabilityRule, 'employeeId'>[]> => ({
	Emma: [
		{ kind: 'course', weekday: monday, date: undefined, startTime: '14:00', endTime: '18:00', status: 'approved', note: 'Cours de pharmacie' },
		{ kind: 'course', weekday: wednesday, date: undefined, startTime: '08:30', endTime: '12:30', status: 'approved', note: '' },
		{
			kind: 'unavailable',
			weekday: undefined,
			date: toIsoDate(addDays(currentMonday, 8 + friday)),
			startTime: '08:00',
			endTime: '19:30',
			status: 'pending',
			note: 'Partiels'
		}
	],
	Thomas: [{ kind: 'unavailable', weekday: thursday, date: undefined, startTime: '17:00', endTime: '19:30', status: 'approved', note: '' }]
});

/** Le planning de démo d'un Tenant : la semaine passée et celle-ci (avec un congé) posées, la suivante vide en brouillon pour la générer. */
export async function seedPlanningDemoData(tenantId: string): Promise<void> {
	const employees = await listEmployees(tenantId);
	const currentMonday = getMondayOfWeek(new Date());

	for (const employee of employees) {
		const firstName = employee.firstName.toDisplayFormat();
		const terms = demoTermsByFirstName[firstName];
		if (terms) {
			await saveEmployeeTerms(tenantId, {
				employeeId: employee.employeeId,
				weeklyContractMinutes: terms.weeklyContractHours * 60,
				hourlyRateCents: Math.round(terms.hourlyRateEuros * 100),
				isStudent: terms.isStudent,
					isPlannedManually: terms.isPlannedManually ?? false,
				availabilityValidation: terms.isStudent ? 'manual' : 'automatic'
			});
		}

		for (const weekOffset of [-1, 0]) {
			const weekMonday = addDays(currentMonday, weekOffset * 7);
			for (const template of demoWeekByFirstName[firstName] ?? []) {
				await insertShift(tenantId, {
					employeeId: employee.employeeId,
					date: toIsoDate(addDays(weekMonday, template.weekdayIndex)),
					startTime: template.startTime,
					endTime: template.endTime
				});
			}
		}

		for (const rule of demoAvailabilityRulesByFirstName(currentMonday)[firstName] ?? []) {
			await insertAvailabilityRule(tenantId, { ...rule, employeeId: employee.employeeId });
		}

		if (firstName === 'Julien') {
			await insertAbsence(tenantId, {
				employeeId: employee.employeeId,
				firstDate: toIsoDate(addDays(currentMonday, wednesday)),
				lastDate: toIsoDate(addDays(currentMonday, thursday)),
				kind: 'Congé'
			});
		}
	}

	for (const weekday of [monday, tuesday, wednesday, thursday, friday]) {
		await insertPeakWindow(tenantId, { weekday, startTime: '17:00', endTime: '19:30', requiredCount: 3 });
	}
	await insertPeakWindow(tenantId, { weekday: saturday, startTime: '10:00', endTime: '12:00', requiredCount: 3 });

	const employeeIdByFirstName = new Map(employees.map((employee) => [employee.firstName.toDisplayFormat(), employee.employeeId]));
	await insertWeekTemplate(tenantId, {
		name: 'Semaine normale',
		rotation: undefined,
		shifts: Object.entries(demoWeekByFirstName).flatMap(([firstName, templates]) => {
			const employeeId = employeeIdByFirstName.get(firstName);
			return employeeId ? templates.map(({ weekdayIndex, startTime, endTime }) => ({ employeeId, weekday: weekdayIndex, startTime, endTime })) : [];
		})
	});

	await savePlannedWeekStatus(tenantId, toIsoDate(addDays(currentMonday, 7)), 'draft');
}

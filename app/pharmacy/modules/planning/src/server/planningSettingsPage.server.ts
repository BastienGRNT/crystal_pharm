import type { AuthenticatedUser } from '@crystal-pharm/auth';
import { fail, type Actions } from '@sveltejs/kit';
import {
	formatCentsAsEurosInput,
	formatMinutesAsHoursInput,
	parseEurosToCents,
	parseHoursToMinutes
} from '../domain/rules/hoursInput';
import type { PlanningSettingsActionResult, PlanningSettingsPageData } from '../pages/planningSettingsPageData';
import { toCalendarDay } from '../domain/calendar/week';
import { describePeakWindow } from '../domain/coverage/peakWindows';
import { summarizeWeekTemplate } from '../domain/templates/weekTemplates';
import { requirePlanningManager } from './activeTenant.server';
import {
	findOvertimeRules,
	findPlanningRules,
	listEmployeeTermsRows,
	updateEmployeeTerms,
	updateOvertimeRules,
	updatePlanningRules
} from './services/settings/planningSettingsService';
import {
	findAccountantEmail,
	sendMonthlyPlanningToAccountant,
	updateAccountantEmail
} from './services/accountant-export/accountantExportService';
import { findPreviousPayrollMonth, formatPayrollMonthParameter } from '../domain/accountant-export/monthlyPayrollExport';
import { addPeakWindow, findPeakWindows, removePeakWindow } from './services/peaks/peakWindowService';
import { findWeekTemplates, removeWeekTemplate } from './services/templates/weekTemplateService';

type SettingsRequest = {
	locals: { user: AuthenticatedUser | null };
};

export async function load({ locals }: SettingsRequest): Promise<PlanningSettingsPageData> {
	const { tenantId } = await requirePlanningManager(locals.user);
	const today = toCalendarDay(new Date());
	const [rules, overtimeRules, accountantEmail, termsRows, peakWindows, templates] = await Promise.all([
		findPlanningRules(tenantId),
		findOvertimeRules(tenantId),
		findAccountantEmail(tenantId),
		listEmployeeTermsRows(tenantId),
		findPeakWindows(tenantId),
		findWeekTemplates(tenantId)
	]);
	return {
		planningHref: '/planning',
		peakWindows: peakWindows.map((peakWindow) => ({ id: peakWindow.id, label: describePeakWindow(peakWindow) })),
		templates: templates.map(summarizeWeekTemplate),
		rules: {
			minimumPharmacistsPresent: String(rules.minimumPharmacistsPresent),
			minimumPeoplePresent: String(rules.minimumPeoplePresent),
			minimumShiftHours: formatMinutesAsHoursInput(rules.minimumShiftMinutes),
			maximumShiftsPerDay: String(rules.maximumShiftsPerDay),
			minimumRestHours: formatMinutesAsHoursInput(rules.minimumRestMinutes)
		},
		overtimeRules: {
			weeklyThresholdHours: formatMinutesAsHoursInput(overtimeRules.weeklyThresholdMinutes),
			firstBandHours: formatMinutesAsHoursInput(overtimeRules.firstBandMinutes),
			firstBandRatePercent: String(overtimeRules.firstBandRatePercent),
			beyondRatePercent: String(overtimeRules.beyondRatePercent)
		},
		accountantExport: {
			accountantEmail: accountantEmail ?? '',
			defaultMonth: formatPayrollMonthParameter(findPreviousPayrollMonth(today)),
			latestMonth: formatPayrollMonthParameter({ year: today.getUTCFullYear(), month: today.getUTCMonth() + 1 }),
			downloadAction: '/planning/parametres/export'
		},
		employees: termsRows.map((row) => ({
			employeeId: row.employeeId,
			fullName: row.fullName,
			jobTitle: row.jobTitle,
			weeklyContractHours: row.weeklyContractMinutes === undefined ? '' : formatMinutesAsHoursInput(row.weeklyContractMinutes),
			hourlyRateEuros: row.hourlyRateCents === undefined ? '' : formatCentsAsEurosInput(row.hourlyRateCents),
			isStudent: row.isStudent,
			isPlannedManually: row.isPlannedManually,
			availabilityValidation: row.availabilityValidation
		}))
	};
}

const readText = (formData: FormData, fieldName: string): string => String(formData.get(fieldName) ?? '').trim();

export const actions = {
	addPeakWindow: async ({ request, locals }) => {
		const { tenantId } = await requirePlanningManager(locals.user);
		const formData = await request.formData();
		const result = await addPeakWindow(tenantId, {
			weekday: readText(formData, 'weekday'),
			startTime: readText(formData, 'startTime'),
			endTime: readText(formData, 'endTime'),
			requiredCount: readText(formData, 'requiredCount')
		});
		if (!result.isSaved) return fail(400, { failedSection: 'peaks', message: result.message } satisfies PlanningSettingsActionResult);
		return { savedSection: 'peaks' } satisfies PlanningSettingsActionResult;
	},

	removePeakWindow: async ({ request, locals }) => {
		const { tenantId } = await requirePlanningManager(locals.user);
		await removePeakWindow(tenantId, readText(await request.formData(), 'peakWindowId'));
		return { savedSection: 'peaks' } satisfies PlanningSettingsActionResult;
	},

	removeTemplate: async ({ request, locals }) => {
		const { tenantId } = await requirePlanningManager(locals.user);
		await removeWeekTemplate(tenantId, readText(await request.formData(), 'templateId'));
		return { savedSection: 'peaks' } satisfies PlanningSettingsActionResult;
	},

	saveRules: async ({ request, locals }) => {
		const { tenantId } = await requirePlanningManager(locals.user);
		const formData = await request.formData();
		const minimumShiftMinutes = parseHoursToMinutes(readText(formData, 'minimumShiftHours'));
		const minimumRestMinutes = parseHoursToMinutes(readText(formData, 'minimumRestHours'));
		if (minimumShiftMinutes === undefined || minimumRestMinutes === undefined) {
			return fail(400, { failedSection: 'rules', message: 'Saisissez des durées en heures (par exemple 2 ou 7,5).' } satisfies PlanningSettingsActionResult);
		}

		const result = await updatePlanningRules(tenantId, {
			minimumPharmacistsPresent: Number(readText(formData, 'minimumPharmacistsPresent')),
			minimumPeoplePresent: Number(readText(formData, 'minimumPeoplePresent')),
			maximumShiftsPerDay: Number(readText(formData, 'maximumShiftsPerDay')),
			minimumShiftMinutes,
			minimumRestMinutes
		});
		if (!result.isSaved) return fail(400, { failedSection: 'rules', message: result.message } satisfies PlanningSettingsActionResult);
		return { savedSection: 'rules' } satisfies PlanningSettingsActionResult;
	},

	saveOvertimeRules: async ({ request, locals }) => {
		const { tenantId } = await requirePlanningManager(locals.user);
		const formData = await request.formData();
		const weeklyThresholdMinutes = parseHoursToMinutes(readText(formData, 'weeklyThresholdHours'));
		const firstBandMinutes = parseHoursToMinutes(readText(formData, 'firstBandHours'));
		if (weeklyThresholdMinutes === undefined || firstBandMinutes === undefined) {
			return fail(400, { failedSection: 'overtime', message: 'Saisissez des durées en heures (par exemple 35 ou 8).' } satisfies PlanningSettingsActionResult);
		}

		const result = await updateOvertimeRules(tenantId, {
			weeklyThresholdMinutes,
			firstBandMinutes,
			firstBandRatePercent: Number(readText(formData, 'firstBandRatePercent')),
			beyondRatePercent: Number(readText(formData, 'beyondRatePercent'))
		});
		if (!result.isSaved) return fail(400, { failedSection: 'overtime', message: result.message } satisfies PlanningSettingsActionResult);
		return { savedSection: 'overtime' } satisfies PlanningSettingsActionResult;
	},

	saveAccountantEmail: async ({ request, locals }) => {
		const { tenantId } = await requirePlanningManager(locals.user);
		const result = await updateAccountantEmail(tenantId, readText(await request.formData(), 'accountantEmail'));
		if (!result.isDone) return fail(400, { failedSection: 'accountant', message: result.message } satisfies PlanningSettingsActionResult);
		return { savedSection: 'accountant', message: result.message } satisfies PlanningSettingsActionResult;
	},

	sendToAccountant: async ({ request, locals }) => {
		const { tenantId } = await requirePlanningManager(locals.user);
		const result = await sendMonthlyPlanningToAccountant(tenantId, readText(await request.formData(), 'month'));
		if (!result.isDone) return fail(400, { failedSection: 'accountant', message: result.message } satisfies PlanningSettingsActionResult);
		return { savedSection: 'accountant', message: result.message } satisfies PlanningSettingsActionResult;
	},

	saveTerms: async ({ request, locals }) => {
		const { tenantId } = await requirePlanningManager(locals.user);
		const formData = await request.formData();
		const employeeId = readText(formData, 'employeeId');
		const contractText = readText(formData, 'weeklyContractHours');
		const rateText = readText(formData, 'hourlyRateEuros');
		const weeklyContractMinutes = contractText === '' ? null : (parseHoursToMinutes(contractText) ?? NaN);
		const hourlyRateCents = rateText === '' ? null : (parseEurosToCents(rateText) ?? NaN);
		if (Number.isNaN(weeklyContractMinutes) || Number.isNaN(hourlyRateCents)) {
			return fail(400, { failedSection: 'terms', employeeId, message: 'Heures ou taux horaire illisibles (par exemple 35 et 12,50).' } satisfies PlanningSettingsActionResult);
		}

		const result = await updateEmployeeTerms(tenantId, {
			employeeId,
			weeklyContractMinutes,
			hourlyRateCents,
			isStudent: formData.get('isStudent') === 'on',
			isPlannedManually: formData.get('isPlannedManually') === 'on',
			availabilityValidation: readText(formData, 'availabilityValidation')
		});
		if (!result.isSaved) return fail(400, { failedSection: 'terms', employeeId, message: result.message } satisfies PlanningSettingsActionResult);
		return { savedSection: 'terms', employeeId } satisfies PlanningSettingsActionResult;
	}
} satisfies Actions;

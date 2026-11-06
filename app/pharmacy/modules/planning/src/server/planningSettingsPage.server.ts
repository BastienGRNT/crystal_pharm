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
import { parsePlanningSettingsTab, planningSettingsTabParameter } from '../domain/settings/planningSettingsTabs';
import { summarizeWeekTemplate } from '../domain/templates/weekTemplates';
import { requirePlanningManager } from './activeTenant.server';
import {
	findOvertimeRules,
	findPlanningRules,
	listEmployeeTermsRows,
	updateEmployeeTerms,
	type EmployeeTermsSubmission,
	updateOvertimeRules,
	updatePlanningRules
} from './services/settings/planningSettingsService';
import {
	findAccountantEmail,
	sendMonthlyPlanningToAccountant,
	updateAccountantEmail
} from './services/accountant-export/accountantExportService';
import {
	findPreviousPayrollMonth,
	formatPayrollMonthLabel,
	formatPayrollMonthParameter,
	listRecentPayrollMonths
} from '../domain/accountant-export/monthlyPayrollExport';
import { findPeakWeek, replacePeakWindowsOfWeek } from './services/peaks/peakWindowService';
import { findWeekTemplates, removeWeekTemplate } from './services/templates/weekTemplateService';

const monthsOfferedForExport = 13;

const capitalize = (text: string): string => text.charAt(0).toLocaleUpperCase('fr') + text.slice(1);

type SettingsRequest = {
	locals: { user: AuthenticatedUser | null };
};

type SettingsPageRequest = SettingsRequest & { url: URL };

export async function load({ locals, url }: SettingsPageRequest): Promise<PlanningSettingsPageData> {
	const { tenantId } = await requirePlanningManager(locals.user);
	const today = toCalendarDay(new Date());
	const [rules, overtimeRules, accountantEmail, termsRows, peakWeek, templates] = await Promise.all([
		findPlanningRules(tenantId),
		findOvertimeRules(tenantId),
		findAccountantEmail(tenantId),
		listEmployeeTermsRows(tenantId),
		findPeakWeek(tenantId),
		findWeekTemplates(tenantId)
	]);
	return {
		planningHref: '/planning',
		selectedTab: parsePlanningSettingsTab(url.searchParams.get(planningSettingsTabParameter)),
		peakWeek: { ...peakWeek, teamSize: termsRows.length, openingHoursHref: '/pharmacie?onglet=horaires' },
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
			monthOptions: listRecentPayrollMonths(today, monthsOfferedForExport).map((month) => ({
				value: formatPayrollMonthParameter(month),
				label: capitalize(formatPayrollMonthLabel(month))
			})),
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

/** Les contrats de toute l'équipe partent ensemble : chaque champ porte l'identifiant de son employé. */
function readEmployeeTermsSubmission(formData: FormData, employeeId: string): EmployeeTermsSubmission | undefined {
	const contractText = readText(formData, `weeklyContractHours.${employeeId}`);
	const rateText = readText(formData, `hourlyRateEuros.${employeeId}`);
	const weeklyContractMinutes = contractText === '' ? null : (parseHoursToMinutes(contractText) ?? NaN);
	const hourlyRateCents = rateText === '' ? null : (parseEurosToCents(rateText) ?? NaN);
	if (Number.isNaN(weeklyContractMinutes) || Number.isNaN(hourlyRateCents)) return undefined;
	return {
		employeeId,
		weeklyContractMinutes,
		hourlyRateCents,
		isStudent: formData.get(`isStudent.${employeeId}`) === 'on',
		isPlannedManually: formData.get(`isPlannedManually.${employeeId}`) === 'on',
		availabilityValidation: readText(formData, `availabilityValidation.${employeeId}`)
	};
}

export const actions = {
	savePeakWindows: async ({ request, locals }) => {
		const { tenantId } = await requirePlanningManager(locals.user);
		const result = await replacePeakWindowsOfWeek(tenantId, readText(await request.formData(), 'peakWindows'));
		if (!result.isSaved) return fail(400, { failedSection: 'peaks', message: result.message } satisfies PlanningSettingsActionResult);
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
		for (const employeeId of formData.getAll('employeeId').map(String)) {
			const submission = readEmployeeTermsSubmission(formData, employeeId);
			if (!submission) {
				return fail(400, { failedSection: 'terms', employeeId, message: 'Heures ou taux horaire illisibles (par exemple 35 et 12,50).' } satisfies PlanningSettingsActionResult);
			}
			const result = await updateEmployeeTerms(tenantId, submission);
			if (!result.isSaved) return fail(400, { failedSection: 'terms', employeeId, message: result.message } satisfies PlanningSettingsActionResult);
		}
		return { savedSection: 'terms' } satisfies PlanningSettingsActionResult;
	}
} satisfies Actions;

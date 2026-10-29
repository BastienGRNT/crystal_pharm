import type { AuthenticatedUser } from '@crystal-pharm/auth';
import { fail, type Actions } from '@sveltejs/kit';
import {
	formatCentsAsEurosInput,
	formatMinutesAsHoursInput,
	parseEurosToCents,
	parseHoursToMinutes
} from '../domain/rules/hoursInput';
import type { PlanningSettingsActionResult, PlanningSettingsPageData } from '../pages/planningSettingsPageData';
import { requireActiveTenantId } from './activeTenant.server';
import {
	findPlanningRules,
	listEmployeeTermsRows,
	updateEmployeeTerms,
	updatePlanningRules
} from './services/settings/planningSettingsService';

type SettingsRequest = {
	locals: { user: AuthenticatedUser | null };
};

export async function load({ locals }: SettingsRequest): Promise<PlanningSettingsPageData> {
	const tenantId = await requireActiveTenantId(locals.user);
	const [rules, termsRows] = await Promise.all([findPlanningRules(tenantId), listEmployeeTermsRows(tenantId)]);
	return {
		planningHref: '/planning',
		rules: {
			minimumPharmacistsPresent: String(rules.minimumPharmacistsPresent),
			minimumPeoplePresent: String(rules.minimumPeoplePresent),
			minimumShiftHours: formatMinutesAsHoursInput(rules.minimumShiftMinutes),
			maximumShiftsPerDay: String(rules.maximumShiftsPerDay),
			minimumRestHours: formatMinutesAsHoursInput(rules.minimumRestMinutes)
		},
		employees: termsRows.map((row) => ({
			employeeId: row.employeeId,
			fullName: row.fullName,
			jobTitle: row.jobTitle,
			weeklyContractHours: row.weeklyContractMinutes === undefined ? '' : formatMinutesAsHoursInput(row.weeklyContractMinutes),
			hourlyRateEuros: row.hourlyRateCents === undefined ? '' : formatCentsAsEurosInput(row.hourlyRateCents),
			isStudent: row.isStudent,
			availabilityValidation: row.availabilityValidation
		}))
	};
}

const readText = (formData: FormData, fieldName: string): string => String(formData.get(fieldName) ?? '').trim();

export const actions = {
	saveRules: async ({ request, locals }) => {
		const tenantId = await requireActiveTenantId(locals.user);
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

	saveTerms: async ({ request, locals }) => {
		const tenantId = await requireActiveTenantId(locals.user);
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
			availabilityValidation: readText(formData, 'availabilityValidation')
		});
		if (!result.isSaved) return fail(400, { failedSection: 'terms', employeeId, message: result.message } satisfies PlanningSettingsActionResult);
		return { savedSection: 'terms', employeeId } satisfies PlanningSettingsActionResult;
	}
} satisfies Actions;

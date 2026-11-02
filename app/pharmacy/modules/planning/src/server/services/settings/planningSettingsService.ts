import { listEmployees } from '@crystal-pharm/pharmacy-db';
import { formatEmployeeFullName } from '@crystal-pharm/pharmacy-db/domain';
import * as v from 'valibot';
import { indexTermsByEmployee, type EmployeeTerms } from '../../../domain/rules/employeeTerms';
import { planningRuleLimits, type PlanningRules } from '../../../domain/rules/planningRules';
import { listEmployeeTerms, saveEmployeeTerms } from '../../repositories/employeeTermsRepository';
import { overtimeRuleLimits, type OvertimeRules } from '../../../domain/overtime/overtimePay';
import {
	findOvertimeRules,
	findPlanningRules,
	saveOvertimeRules,
	savePlanningRules
} from '../../repositories/planningSettingsRepository';

export { findOvertimeRules, findPlanningRules };

export type PlanningSettingsResult = { isSaved: true } | { isSaved: false; message: string };

const limitedInteger = (rule: keyof PlanningRules, message: string) =>
	v.pipe(
		v.number(message),
		v.integer(message),
		v.minValue(planningRuleLimits[rule].min, message),
		v.maxValue(planningRuleLimits[rule].max, message)
	);

const PlanningRulesSchema = v.object({
	minimumPharmacistsPresent: limitedInteger('minimumPharmacistsPresent', 'Le nombre de pharmaciens doit être compris entre 0 et 10.'),
	minimumPeoplePresent: limitedInteger('minimumPeoplePresent', 'Le nombre de personnes doit être compris entre 0 et 30.'),
	minimumShiftMinutes: limitedInteger('minimumShiftMinutes', 'La durée minimale d’une plage doit aller jusqu’à 8 h.'),
	maximumShiftsPerDay: limitedInteger('maximumShiftsPerDay', 'Une journée compte entre 1 et 4 plages.'),
	minimumRestMinutes: limitedInteger('minimumRestMinutes', 'Le repos entre deux journées va jusqu’à 16 h.')
});

export async function updatePlanningRules(tenantId: string, submission: PlanningRules): Promise<PlanningSettingsResult> {
	const validation = v.safeParse(PlanningRulesSchema, submission);
	if (!validation.success) return { isSaved: false, message: validation.issues[0].message };
	if (validation.output.minimumPeoplePresent < validation.output.minimumPharmacistsPresent) {
		return { isSaved: false, message: 'Il faut au moins autant de personnes que de pharmaciens présents.' };
	}
	await savePlanningRules(tenantId, validation.output);
	return { isSaved: true };
}

const limitedOvertimeValue = (rule: keyof OvertimeRules, message: string) =>
	v.pipe(
		v.number(message),
		v.integer(message),
		v.minValue(overtimeRuleLimits[rule].min, message),
		v.maxValue(overtimeRuleLimits[rule].max, message)
	);

const OvertimeRulesSchema = v.object({
	weeklyThresholdMinutes: limitedOvertimeValue('weeklyThresholdMinutes', 'Le seuil des heures supplémentaires va de 1 h à 48 h.'),
	firstBandMinutes: limitedOvertimeValue('firstBandMinutes', 'La première tranche va jusqu’à 13 h.'),
	firstBandRatePercent: limitedOvertimeValue('firstBandRatePercent', 'Une majoration va de 10 % à 200 %.'),
	beyondRatePercent: limitedOvertimeValue('beyondRatePercent', 'Une majoration va de 10 % à 200 %.')
});

export async function updateOvertimeRules(tenantId: string, submission: OvertimeRules): Promise<PlanningSettingsResult> {
	const validation = v.safeParse(OvertimeRulesSchema, submission);
	if (!validation.success) return { isSaved: false, message: validation.issues[0].message };
	if (validation.output.beyondRatePercent < validation.output.firstBandRatePercent) {
		return { isSaved: false, message: 'Les heures au-delà de la première tranche ne peuvent pas être moins majorées qu’elle.' };
	}
	await saveOvertimeRules(tenantId, validation.output);
	return { isSaved: true };
}

export type EmployeeTermsRow = EmployeeTerms & { fullName: string; jobTitle: string };

/** Tous les employés de la pharmacie avec leur contrat, ceux non renseignés ayant les valeurs par défaut. */
export async function listEmployeeTermsRows(tenantId: string): Promise<EmployeeTermsRow[]> {
	const [pharmacyEmployees, savedTerms] = await Promise.all([listEmployees(tenantId), listEmployeeTerms(tenantId)]);
	const termsByEmployee = indexTermsByEmployee(
		pharmacyEmployees.map((employee) => employee.employeeId),
		savedTerms
	);
	return pharmacyEmployees.flatMap((employee) => {
		const terms = termsByEmployee.get(employee.employeeId);
		return terms ? [{ ...terms, fullName: formatEmployeeFullName(employee), jobTitle: employee.jobTitle.toDisplayFormat() }] : [];
	});
}

const EmployeeTermsSchema = v.object({
	employeeId: v.pipe(v.string(), v.uuid('Employé introuvable.')),
	weeklyContractMinutes: v.nullable(
		v.pipe(v.number('Heures de contrat invalides.'), v.integer(), v.minValue(60, 'Le contrat doit compter au moins 1 h.'), v.maxValue(48 * 60, 'Le contrat ne peut pas dépasser 48 h par semaine.'))
	),
	hourlyRateCents: v.nullable(
		v.pipe(v.number('Taux horaire invalide.'), v.integer(), v.minValue(0, 'Le taux horaire ne peut pas être négatif.'), v.maxValue(100_000, 'Taux horaire trop élevé.'))
	),
	isStudent: v.boolean(),
	isPlannedManually: v.boolean(),
	availabilityValidation: v.picklist(['automatic', 'manual'], 'Choisissez une validation.')
});

export type EmployeeTermsSubmission = {
	employeeId: string;
	weeklyContractMinutes: number | null;
	hourlyRateCents: number | null;
	isStudent: boolean;
	isPlannedManually: boolean;
	availabilityValidation: string;
};

export async function updateEmployeeTerms(
	tenantId: string,
	submission: EmployeeTermsSubmission
): Promise<PlanningSettingsResult> {
	const validation = v.safeParse(EmployeeTermsSchema, submission);
	if (!validation.success) return { isSaved: false, message: validation.issues[0].message };
	const { employeeId, weeklyContractMinutes, hourlyRateCents, ...rest } = validation.output;

	// La clé étrangère vers l'employé ne passe pas par la Row-Level Security : on refuse ici l'employé d'une autre pharmacie.
	const pharmacyEmployees = await listEmployees(tenantId);
	if (!pharmacyEmployees.some((employee) => employee.employeeId === employeeId)) {
		return { isSaved: false, message: 'Cet employé ne fait plus partie de l’équipe.' };
	}

	await saveEmployeeTerms(tenantId, {
		employeeId,
		weeklyContractMinutes: weeklyContractMinutes ?? undefined,
		hourlyRateCents: hourlyRateCents ?? undefined,
		...rest
	});
	return { isSaved: true };
}

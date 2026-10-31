import type { WeekTemplateSummary } from '../domain/templates/weekTemplates';
import type { AvailabilityValidation } from '../domain/rules/employeeTerms';

/** Les règles de la pharmacie, telles qu'un champ de formulaire les montre. */
export type PlanningRulesFormValues = {
	minimumPharmacistsPresent: string;
	minimumPeoplePresent: string;
	minimumShiftHours: string;
	maximumShiftsPerDay: string;
	minimumRestHours: string;
};

export type OvertimeRulesFormValues = {
	weeklyThresholdHours: string;
	firstBandHours: string;
	firstBandRatePercent: string;
	beyondRatePercent: string;
};

export type EmployeeTermsFormRow = {
	employeeId: string;
	fullName: string;
	jobTitle: string;
	weeklyContractHours: string;
	hourlyRateEuros: string;
	isStudent: boolean;
	isPlannedManually: boolean;
	availabilityValidation: AvailabilityValidation;
};

export type PeakWindowView = { id: string; label: string };

export type WeekTemplateView = WeekTemplateSummary;

export type PlanningSettingsPageData = {
	planningHref: string;
	peakWindows: PeakWindowView[];
	templates: WeekTemplateView[];
	rules: PlanningRulesFormValues;
	overtimeRules: OvertimeRulesFormValues;
	employees: EmployeeTermsFormRow[];
};

export type PlanningSettingsActionResult =
	| { savedSection: 'rules' | 'overtime' | 'terms' | 'peaks'; employeeId?: string }
	| { failedSection: 'rules' | 'overtime' | 'terms' | 'peaks'; employeeId?: string; message: string };

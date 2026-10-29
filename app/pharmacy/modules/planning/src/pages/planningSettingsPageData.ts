import type { AvailabilityValidation } from '../domain/rules/employeeTerms';

/** Les règles de la pharmacie, telles qu'un champ de formulaire les montre. */
export type PlanningRulesFormValues = {
	minimumPharmacistsPresent: string;
	minimumPeoplePresent: string;
	minimumShiftHours: string;
	maximumShiftsPerDay: string;
	minimumRestHours: string;
};

export type EmployeeTermsFormRow = {
	employeeId: string;
	fullName: string;
	jobTitle: string;
	weeklyContractHours: string;
	hourlyRateEuros: string;
	isStudent: boolean;
	availabilityValidation: AvailabilityValidation;
};

export type PeakWindowView = { id: string; label: string };

export type WeekTemplateView = { id: string; name: string; rotationLabel: string; shiftCount: number };

export type PlanningSettingsPageData = {
	planningHref: string;
	peakWindows: PeakWindowView[];
	templates: WeekTemplateView[];
	rules: PlanningRulesFormValues;
	employees: EmployeeTermsFormRow[];
};

export type PlanningSettingsActionResult =
	| { savedSection: 'rules' | 'terms' | 'peaks'; employeeId?: string }
	| { failedSection: 'rules' | 'terms' | 'peaks'; employeeId?: string; message: string };

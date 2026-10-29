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

export type PlanningSettingsPageData = {
	planningHref: string;
	rules: PlanningRulesFormValues;
	employees: EmployeeTermsFormRow[];
};

export type PlanningSettingsActionResult =
	| { savedSection: 'rules' | 'terms'; employeeId?: string }
	| { failedSection: 'rules' | 'terms'; employeeId?: string; message: string };

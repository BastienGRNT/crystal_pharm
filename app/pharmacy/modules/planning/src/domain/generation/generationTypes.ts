import type { AvailabilityRule } from '../availability/availabilityRules';
import type { OpeningHours } from '../coverage/coverage';
import type { RequirementWindow } from '../coverage/staffing';
import type { Absence, Shift } from '../planning';
import type { PlanningRules } from '../rules/planningRules';

export type GenerationEmployee = {
	id: string;
	fullName: string;
	isPharmacist: boolean;
	isStudent: boolean;
	/** `undefined` : pas de minimum au contrat, chaque heure posée est payée en plus. */
	weeklyContractMinutes: number | undefined;
	hourlyRateCents: number | undefined;
};

export type GenerationInput = {
	/** Les sept jours de la semaine, du lundi au dimanche. */
	weekDates: string[];
	openingPeriodsByDate: OpeningHours[][];
	requirementWindowsByDate: RequirementWindow[][];
	rules: PlanningRules;
	employees: GenerationEmployee[];
	absences: Absence[];
	/** Seulement les règles validées. */
	availabilityRules: AvailabilityRule[];
	/** Ce qui est déjà posé : la génération le garde et ne comble que ce qui manque. */
	existingShifts: Shift[];
};

export type ProposedShift = {
	employeeId: string;
	date: string;
	startTime: string;
	endTime: string;
	/** Pourquoi cette personne à cette heure, en une phrase. */
	reason: string;
};

export type GenerationGapKind = 'pharmacist' | 'people';

/** Une plage que personne ne peut tenir : le titulaire doit trancher. */
export type GenerationGap = {
	date: string;
	kind: GenerationGapKind;
	startMinutes: number;
	endMinutes: number;
	message: string;
};

export type GenerationResult = {
	proposedShifts: ProposedShift[];
	gaps: GenerationGap[];
};

/** Les bornes du droit du travail que la génération ne dépasse jamais. */
export const generationLimits = {
	maximumContinuousMinutes: 6 * 60,
	maximumDailyMinutes: 10 * 60,
	maximumWeeklyMinutes: 48 * 60,
	overtimeThresholdMinutes: 35 * 60,
	overtimeMultiplier: 1.25,
	defaultHourlyRateCents: 1500,
	slotMinutes: 30
} as const;

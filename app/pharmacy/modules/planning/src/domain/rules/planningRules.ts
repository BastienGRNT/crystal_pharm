/** Les règles que chaque pharmacie fixe pour son équipe : le planning proposé et les alertes s'y plient. */
export type PlanningRules = {
	/** Pharmaciens présents en permanence pendant l'ouverture. */
	minimumPharmacistsPresent: number;
	/** Personnes présentes en permanence pendant l'ouverture, pharmaciens compris. */
	minimumPeoplePresent: number;
	/** Durée minimale d'une plage : on ne fait pas venir quelqu'un pour une heure. */
	minimumShiftMinutes: number;
	/** Plages par jour pour un même employé (2 : matin et après-midi, avec la pause de midi). */
	maximumShiftsPerDay: number;
	/** Repos minimal entre la fin d'une journée et le début de la suivante. */
	minimumRestMinutes: number;
};

export const defaultPlanningRules: PlanningRules = {
	minimumPharmacistsPresent: 1,
	minimumPeoplePresent: 2,
	minimumShiftMinutes: 120,
	maximumShiftsPerDay: 2,
	minimumRestMinutes: 11 * 60
};

export const planningRuleLimits = {
	minimumPharmacistsPresent: { min: 0, max: 10 },
	minimumPeoplePresent: { min: 0, max: 30 },
	minimumShiftMinutes: { min: 0, max: 8 * 60 },
	maximumShiftsPerDay: { min: 1, max: 4 },
	minimumRestMinutes: { min: 0, max: 16 * 60 }
} as const satisfies Record<keyof PlanningRules, { min: number; max: number }>;

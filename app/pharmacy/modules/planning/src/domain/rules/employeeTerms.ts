/** Le choix de l'employé pour ses propres disponibilités : le titulaire les valide, ou elles comptent tout de suite. */
export type AvailabilityValidation = 'automatic' | 'manual';

/** Ce que le planning sait d'un employé en plus de sa fiche : son contrat et son statut. */
export type EmployeeTerms = {
	employeeId: string;
	/** `undefined` : pas de minimum d'heures au contrat. */
	weeklyContractMinutes: number | undefined;
	/** En centimes par heure, hors charges ; `undefined` tant qu'il n'est pas renseigné. */
	hourlyRateCents: number | undefined;
	isStudent: boolean;
	availabilityValidation: AvailabilityValidation;
};

export function buildDefaultEmployeeTerms(employeeId: string): EmployeeTerms {
	return {
		employeeId,
		weeklyContractMinutes: undefined,
		hourlyRateCents: undefined,
		isStudent: false,
		availabilityValidation: 'manual'
	};
}

/** Les termes de chaque employé donné, ceux non renseignés prenant les valeurs par défaut. */
export function indexTermsByEmployee(employeeIds: string[], savedTerms: EmployeeTerms[]): Map<string, EmployeeTerms> {
	const savedByEmployee = new Map(savedTerms.map((terms) => [terms.employeeId, terms]));
	return new Map(
		employeeIds.map((employeeId) => [employeeId, savedByEmployee.get(employeeId) ?? buildDefaultEmployeeTerms(employeeId)])
	);
}

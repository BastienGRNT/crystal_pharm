/** Le nombre de teintes de la palette de `ui` (`category-1` à `category-7`) : au-delà, elles reviennent. */
export const employeeColorCount = 7;

/** « Camille Martin » → « CM », « Jean-Marc Dupont » → « JD », « Inès » → « IN ». */
export function formatEmployeeInitials(fullName: string): string {
	const words = fullName.trim().split(/\s+/).filter((word) => word !== '');
	const firstWord = words[0] ?? '';
	const lastWord = words.length > 1 ? (words[words.length - 1] ?? '') : '';
	const initials = lastWord === '' ? firstWord.slice(0, 2) : `${firstWord.charAt(0)}${lastWord.charAt(0)}`;
	return initials.toLocaleUpperCase('fr');
}

/**
 * Chaque employé garde sa teinte d'un écran à l'autre : elle dépend de son identifiant, jamais de l'ordre
 * d'affichage. Rangés par identifiant, deux voisins n'ont jamais la même tant que l'équipe tient en sept.
 */
export function assignEmployeeColorIndexes(employeeIds: string[]): Map<string, number> {
	const sortedIds = [...new Set(employeeIds)].sort();
	return new Map(sortedIds.map((employeeId, position) => [employeeId, position % employeeColorCount]));
}

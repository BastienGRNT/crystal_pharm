const nonBreakingSpacePattern = /[\s ]/g;

/** « 7,5 » ou « 7.5 » → 450 minutes ; `undefined` si ce n'est pas un nombre d'heures. */
export function parseHoursToMinutes(hoursText: string): number | undefined {
	const normalizedText = hoursText.replace(nonBreakingSpacePattern, '').replace(',', '.');
	if (normalizedText === '' || !/^\d+(\.\d+)?$/.test(normalizedText)) return undefined;
	return Math.round(Number(normalizedText) * 60);
}

/** 450 minutes → « 7,5 », pour remplir un champ. */
export function formatMinutesAsHoursInput(totalMinutes: number): string {
	return String(totalMinutes / 60).replace('.', ',');
}

/** « 12,50 » → 1250 centimes ; `undefined` si ce n'est pas un montant. */
export function parseEurosToCents(eurosText: string): number | undefined {
	const normalizedText = eurosText.replace(nonBreakingSpacePattern, '').replace(',', '.');
	if (normalizedText === '' || !/^\d+(\.\d{1,2})?$/.test(normalizedText)) return undefined;
	return Math.round(Number(normalizedText) * 100);
}

/** 1250 centimes → « 12,50 », pour remplir un champ. */
export function formatCentsAsEurosInput(cents: number): string {
	return (cents / 100).toFixed(2).replace('.', ',');
}

const dayFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

/** « 23 octobre 2026 » */
export function formatDay(date: Date): string {
	return dayFormat.format(date);
}

/** Le dernier jour d'une période qui s'arrête à `endsAt` (minuit) : « jusqu'au 31 octobre 2026 ». */
export function formatLastDayBefore(endsAt: Date): string {
	return dayFormat.format(new Date(endsAt.getTime() - 1));
}

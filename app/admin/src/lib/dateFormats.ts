const dayFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

/** « 23 octobre 2026 » */
export function formatDay(date: Date): string {
	return dayFormat.format(date);
}

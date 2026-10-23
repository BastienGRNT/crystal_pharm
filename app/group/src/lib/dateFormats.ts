const dayFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

/** « 23 octobre 2026 » */
export function formatDay(date: Date): string {
	return dayFormat.format(date);
}

/** « dans 12 jours », « demain », « aujourd’hui » */
export function formatDaysUntil(date: Date, now = new Date()): string {
	const dayCount = Math.ceil((date.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
	if (dayCount <= 0) return 'aujourd’hui';
	if (dayCount === 1) return 'demain';
	return `dans ${dayCount} jours`;
}

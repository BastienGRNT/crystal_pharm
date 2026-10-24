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

/** « 24 octobre 2026 », pour un jour sans heure (`2026-10-24`). */
export function formatCalendarDay(calendarDay: string): string {
	return formatDay(new Date(`${calendarDay}T12:00:00`));
}

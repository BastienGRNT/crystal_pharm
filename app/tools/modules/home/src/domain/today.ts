const fullDayTitle = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

/** « Jeudi 22 octobre ». */
export function formatTodayTitle(today: Date): string {
	const title = fullDayTitle.format(today);
	return title.charAt(0).toUpperCase() + title.slice(1);
}

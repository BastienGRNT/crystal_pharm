const shortDayFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
const millisecondsPerDay = 24 * 60 * 60 * 1000;

export function toCalendarDay(isoDay: string): Date {
	return new Date(`${isoDay}T00:00:00Z`);
}

export function countDaysBetween(fromIsoDay: string, toIsoDay: string): number {
	return Math.round((toCalendarDay(toIsoDay).getTime() - toCalendarDay(fromIsoDay).getTime()) / millisecondsPerDay);
}

/** « aujourd’hui », « demain », sinon « lun. 26 oct. ». */
export function describeDay(isoDay: string, todayIsoDate: string): string {
	const daysFromToday = countDaysBetween(todayIsoDate, isoDay);
	if (daysFromToday === 0) return 'aujourd’hui';
	if (daysFromToday === 1) return 'demain';
	return shortDayFormat.format(toCalendarDay(isoDay));
}

export function capitalize(text: string): string {
	return text.charAt(0).toLocaleUpperCase('fr') + text.slice(1);
}

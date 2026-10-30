// Toutes les dates sont des jours calendaires à minuit UTC : aucun décalage horaire ne peut changer le jour affiché.

const millisecondsPerDay = 24 * 60 * 60 * 1000;
const dayParameterPattern = /^\d{4}-\d{2}-\d{2}$/;

export function toCalendarDay(date: Date): Date {
	return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

export function addDays(day: Date, numberOfDays: number): Date {
	return new Date(day.getTime() + numberOfDays * millisecondsPerDay);
}

export function fromIsoDate(isoDate: string): Date {
	return new Date(`${isoDate}T00:00:00Z`);
}

export function toIsoDate(day: Date): string {
	return day.toISOString().slice(0, 10);
}

export function isSameDay(firstDay: Date, secondDay: Date): boolean {
	return toIsoDate(firstDay) === toIsoDate(secondDay);
}

export function getMondayOfWeek(day: Date): Date {
	const daysSinceMonday = (day.getUTCDay() + 6) % 7;
	return addDays(day, -daysSinceMonday);
}

export function listWeekDays(monday: Date): Date[] {
	return Array.from({ length: 7 }, (_, dayIndex) => addDays(monday, dayIndex));
}

/** Lit `?jour=2026-10-22` ; sans paramètre valide, c'est `today`. */
export function parseDayParameter(dayParameter: string | null, today: Date): Date {
	if (!dayParameter || !dayParameterPattern.test(dayParameter)) return today;
	const day = fromIsoDate(dayParameter);
	const isExistingDay = !Number.isNaN(day.getTime()) && toIsoDate(day) === dayParameter;
	return isExistingDay ? day : today;
}

const shortDayLabel = new Intl.DateTimeFormat('fr-FR', {
	weekday: 'short',
	day: 'numeric',
	month: 'short',
	timeZone: 'UTC'
});
const dayNumberAndShortMonth = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const shortDayName = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', timeZone: 'UTC' });
const fullDayTitle = new Intl.DateTimeFormat('fr-FR', {
	weekday: 'long',
	day: 'numeric',
	month: 'long',
	timeZone: 'UTC'
});

/** « jeu. 22 oct. », la date courte du design system. */
export function formatShortDay(day: Date): string {
	return shortDayLabel.format(day);
}

/** « jeudi 22 octobre ». */
export function formatFullDay(day: Date): string {
	return fullDayTitle.format(day);
}

/** « 19 → 25 oct. », ou « 28 sept. → 4 oct. » à cheval sur deux mois. */
export function formatWeekRange(monday: Date): string {
	const sunday = addDays(monday, 6);
	const isSameMonth = monday.getUTCMonth() === sunday.getUTCMonth();
	const start = isSameMonth ? String(monday.getUTCDate()) : dayNumberAndShortMonth.format(monday);
	return `${start} → ${dayNumberAndShortMonth.format(sunday)}`;
}

/** « lun. 19 », pour l'en-tête d'une colonne de la semaine. */
export function formatDayColumnTitle(day: Date): string {
	return `${shortDayName.format(day)} ${day.getUTCDate()}`;
}

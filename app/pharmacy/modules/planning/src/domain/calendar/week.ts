// Toutes les dates sont des jours calendaires à minuit UTC : aucun décalage horaire ne peut changer le jour affiché.

const millisecondsPerDay = 24 * 60 * 60 * 1000;
const weekParameterPattern = /^(\d{4})-W(\d{2})$/;
const dayParameterPattern = /^\d{4}-\d{2}-\d{2}$/;

export type IsoWeek = {
	year: number;
	weekNumber: number;
};

export function toCalendarDay(date: Date): Date {
	return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

export function addDays(day: Date, numberOfDays: number): Date {
	return new Date(day.getTime() + numberOfDays * millisecondsPerDay);
}

export function toIsoDate(day: Date): string {
	return day.toISOString().slice(0, 10);
}

export function getMondayOfWeek(day: Date): Date {
	const daysSinceMonday = (day.getUTCDay() + 6) % 7;
	return addDays(day, -daysSinceMonday);
}

export function getIsoWeek(day: Date): IsoWeek {
	const thursdayOfSameWeek = addDays(getMondayOfWeek(day), 3);
	const year = thursdayOfSameWeek.getUTCFullYear();
	const firstOfJanuary = new Date(Date.UTC(year, 0, 1));
	const dayOfYear = Math.round((thursdayOfSameWeek.getTime() - firstOfJanuary.getTime()) / millisecondsPerDay);
	return { year, weekNumber: Math.floor(dayOfYear / 7) + 1 };
}

export function getMondayOfIsoWeek({ year, weekNumber }: IsoWeek): Date {
	const fourthOfJanuary = new Date(Date.UTC(year, 0, 4));
	return addDays(getMondayOfWeek(fourthOfJanuary), (weekNumber - 1) * 7);
}

export function formatWeekParameter(monday: Date): string {
	const { year, weekNumber } = getIsoWeek(monday);
	return `${year}-W${String(weekNumber).padStart(2, '0')}`;
}

/** Lit `?week=2026-W40` ; sans paramètre valide, c'est la semaine de `today`. */
export function parseWeekParameter(weekParameter: string | null, today: Date): Date {
	const match = weekParameter?.match(weekParameterPattern);
	if (!match) return getMondayOfWeek(today);

	const isoWeek = { year: Number(match[1]), weekNumber: Number(match[2]) };
	const monday = getMondayOfIsoWeek(isoWeek);
	const isExistingWeek = getIsoWeek(monday).weekNumber === isoWeek.weekNumber;
	return isExistingWeek ? monday : getMondayOfWeek(today);
}

/** Lit `?jour=2026-10-22` ; sans paramètre valide, c'est `today`. */
export function parseDayParameter(dayParameter: string | null, today: Date): Date {
	if (!dayParameter || !dayParameterPattern.test(dayParameter)) return today;
	const day = new Date(`${dayParameter}T00:00:00Z`);
	const isExistingDay = !Number.isNaN(day.getTime()) && toIsoDate(day) === dayParameter;
	return isExistingDay ? day : today;
}

export function listWeekDays(monday: Date): Date[] {
	return Array.from({ length: 7 }, (_, dayIndex) => addDays(monday, dayIndex));
}

const dayAndFullMonth = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', timeZone: 'UTC' });
const shortDayName = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', timeZone: 'UTC' });
const fullDayTitle = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

function capitalize(text: string): string {
	return text.charAt(0).toUpperCase() + text.slice(1);
}

/** « Semaine du 5 au 11 octobre », ou « Semaine du 28 septembre au 4 octobre » à cheval sur deux mois. */
export function formatWeekRange(monday: Date): string {
	const sunday = addDays(monday, 6);
	const isSameMonth = monday.getUTCMonth() === sunday.getUTCMonth();
	const start = isSameMonth ? String(monday.getUTCDate()) : dayAndFullMonth.format(monday);
	return `Semaine du ${start} au ${dayAndFullMonth.format(sunday)}`;
}

export function formatWeekLabel(monday: Date): string {
	return `Semaine ${getIsoWeek(monday).weekNumber}`;
}

/** « Lun », sans le point de l'abréviation. */
export function formatDayName(day: Date): string {
	return capitalize(shortDayName.format(day).replace('.', ''));
}

/** « Jeudi 22 octobre ». */
export function formatDayTitle(day: Date): string {
	return capitalize(fullDayTitle.format(day));
}

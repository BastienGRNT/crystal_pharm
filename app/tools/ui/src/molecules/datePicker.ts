// Jours calendaires à minuit UTC, au format du champ de formulaire (AAAA-MM-JJ).

const millisecondsPerDay = 24 * 60 * 60 * 1000;
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export function parseIsoDate(isoDate: string): Date | undefined {
	if (!isoDatePattern.test(isoDate)) return undefined;
	const day = new Date(`${isoDate}T00:00:00Z`);
	return Number.isNaN(day.getTime()) || toIsoDate(day) !== isoDate ? undefined : day;
}

export function toIsoDate(day: Date): string {
	return day.toISOString().slice(0, 10);
}

export function todayAsCalendarDay(): Date {
	const now = new Date();
	return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

export function addDays(day: Date, numberOfDays: number): Date {
	return new Date(day.getTime() + numberOfDays * millisecondsPerDay);
}

/** Le même jour du mois voisin, ramené au dernier jour si ce mois est plus court. */
export function addMonths(day: Date, numberOfMonths: number): Date {
	const firstOfTargetMonth = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth() + numberOfMonths, 1));
	const daysInTargetMonth = new Date(
		Date.UTC(firstOfTargetMonth.getUTCFullYear(), firstOfTargetMonth.getUTCMonth() + 1, 0)
	).getUTCDate();
	return new Date(
		Date.UTC(
			firstOfTargetMonth.getUTCFullYear(),
			firstOfTargetMonth.getUTCMonth(),
			Math.min(day.getUTCDate(), daysInTargetMonth)
		)
	);
}

export function isSameMonth(first: Date, second: Date): boolean {
	return first.getUTCFullYear() === second.getUTCFullYear() && first.getUTCMonth() === second.getUTCMonth();
}

/** Les semaines (du lundi au dimanche) qui couvrent le mois du jour donné. */
export function buildMonthWeeks(dayInMonth: Date): Date[][] {
	const firstOfMonth = new Date(Date.UTC(dayInMonth.getUTCFullYear(), dayInMonth.getUTCMonth(), 1));
	const daysSinceMonday = (firstOfMonth.getUTCDay() + 6) % 7;
	let weekStart = addDays(firstOfMonth, -daysSinceMonday);
	const weeks: Date[][] = [];
	do {
		const weekMonday = weekStart;
		weeks.push(Array.from({ length: 7 }, (_, dayIndex) => addDays(weekMonday, dayIndex)));
		weekStart = addDays(weekStart, 7);
	} while (isSameMonth(weekStart, firstOfMonth));
	return weeks;
}

const monthTitle = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const fullDate = new Intl.DateTimeFormat('fr-FR', {
	weekday: 'long',
	day: 'numeric',
	month: 'long',
	year: 'numeric',
	timeZone: 'UTC'
});

function capitalize(text: string): string {
	return text.charAt(0).toUpperCase() + text.slice(1);
}

/** « Octobre 2026 ». */
export function formatMonthTitle(day: Date): string {
	return capitalize(monthTitle.format(day));
}

/** « Jeudi 22 octobre 2026 ». */
export function formatFullDate(day: Date): string {
	return capitalize(fullDate.format(day));
}

export const weekdayInitials = [
	{ initial: 'L', name: 'lundi' },
	{ initial: 'M', name: 'mardi' },
	{ initial: 'M', name: 'mercredi' },
	{ initial: 'J', name: 'jeudi' },
	{ initial: 'V', name: 'vendredi' },
	{ initial: 'S', name: 'samedi' },
	{ initial: 'D', name: 'dimanche' }
] as const;

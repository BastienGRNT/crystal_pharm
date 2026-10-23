import {
	weekdays,
	type OpeningPeriod,
	type Weekday,
	type WeeklyOpeningSchedule
} from '@crystal-pharm/pharmacy-db/domain';

/** Une journée en cours de saisie : fermée, elle garde ses plages pour qu'on la rouvre sans tout retaper. */
export type DailyOpeningDraft = { isOpen: boolean; periods: OpeningPeriod[] };

export type OpeningHoursDraft = Record<Weekday, DailyOpeningDraft>;

export const weekdayLabels: Record<Weekday, string> = {
	monday: 'Lundi',
	tuesday: 'Mardi',
	wednesday: 'Mercredi',
	thursday: 'Jeudi',
	friday: 'Vendredi',
	saturday: 'Samedi',
	sunday: 'Dimanche'
};

const usualPharmacyPeriods: readonly OpeningPeriod[] = [
	{ opensAt: '09:00', closesAt: '12:30' },
	{ opensAt: '14:00', closesAt: '19:30' }
];
const usuallyClosedWeekdays: readonly Weekday[] = ['sunday'];
const workingWeekdaysAfterMonday: readonly Weekday[] = ['tuesday', 'wednesday', 'thursday', 'friday'];

const lunchBreak = { startsAt: '12:30', endsAt: '14:00' };
const minimumMinutesToAddBreak = 60;
const breakMinutesAroundMiddle = 15;
const minutesPerHour = 60;
const quarterHourInMinutes = 15;

function mapWeekdays<Value>(valueOfWeekday: (weekday: Weekday) => Value): Record<Weekday, Value> {
	return Object.fromEntries(weekdays.map((weekday) => [weekday, valueOfWeekday(weekday)])) as Record<Weekday, Value>;
}

function copyPeriods(periods: readonly OpeningPeriod[]): OpeningPeriod[] {
	return periods.map((period) => ({ ...period }));
}

/** Du lundi au samedi, 9 h – 12 h 30 et 14 h – 19 h 30 : un point de départ à ajuster. */
export function suggestUsualPharmacyOpeningHours(): OpeningHoursDraft {
	return mapWeekdays((weekday) => ({
		isOpen: !usuallyClosedWeekdays.includes(weekday),
		periods: copyPeriods(usualPharmacyPeriods)
	}));
}

export function toOpeningHoursDraft(weeklyOpeningSchedule: WeeklyOpeningSchedule): OpeningHoursDraft {
	return mapWeekdays((weekday) => {
		const periods = weeklyOpeningSchedule[weekday];
		return periods.length > 0
			? { isOpen: true, periods: copyPeriods(periods) }
			: { isOpen: false, periods: copyPeriods(usualPharmacyPeriods) };
	});
}

export function toWeeklyOpeningSchedule(draft: OpeningHoursDraft): WeeklyOpeningSchedule {
	return mapWeekdays((weekday) => (draft[weekday].isOpen ? copyPeriods(draft[weekday].periods) : []));
}

export function applyMondayToOtherWorkingDays(draft: OpeningHoursDraft): OpeningHoursDraft {
	return mapWeekdays((weekday) =>
		workingWeekdaysAfterMonday.includes(weekday)
			? { isOpen: draft.monday.isOpen, periods: copyPeriods(draft.monday.periods) }
			: draft[weekday]
	);
}

export function canAddBreak(periods: readonly OpeningPeriod[]): boolean {
	const [onlyPeriod] = periods;
	return (
		periods.length === 1 &&
		onlyPeriod !== undefined &&
		toMinutes(onlyPeriod.closesAt) - toMinutes(onlyPeriod.opensAt) >= minimumMinutesToAddBreak
	);
}

/** Coupe la plage unique de la journée : à l'heure du déjeuner si elle la couvre, sinon en son milieu. */
export function addBreak(periods: readonly OpeningPeriod[]): OpeningPeriod[] {
	const [onlyPeriod] = periods;
	if (!onlyPeriod || !canAddBreak(periods)) return copyPeriods(periods);

	const { opensAt, closesAt } = onlyPeriod;
	if (opensAt < lunchBreak.startsAt && closesAt > lunchBreak.endsAt) {
		return [
			{ opensAt, closesAt: lunchBreak.startsAt },
			{ opensAt: lunchBreak.endsAt, closesAt }
		];
	}

	const middle = roundToQuarterHour((toMinutes(opensAt) + toMinutes(closesAt)) / 2);
	return [
		{ opensAt, closesAt: toTime(middle - breakMinutesAroundMiddle) },
		{ opensAt: toTime(middle + breakMinutesAroundMiddle), closesAt }
	];
}

function toMinutes(time: string): number {
	const [hours = 0, minutes = 0] = time.split(':').map(Number);
	return hours * minutesPerHour + minutes;
}

function toTime(totalMinutes: number): string {
	const hours = Math.floor(totalMinutes / minutesPerHour);
	const minutes = totalMinutes % minutesPerHour;
	return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function roundToQuarterHour(totalMinutes: number): number {
	return Math.round(totalMinutes / quarterHourInMinutes) * quarterHourInMinutes;
}

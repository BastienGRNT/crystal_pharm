import type { OnDutyPeriod } from '@crystal-pharm/schema';
import * as v from 'valibot';

/** Une garde telle que le Manager la saisit, à l'heure de Paris. Une fin avant le début, c'est le lendemain (garde de nuit). */
export type OnDutyPeriodDraft = { day: string; startTime: string; endTime: string };

export type OnDutyPeriodsReading = { success: true; periods: OnDutyPeriod[] } | { success: false; formError: string };

const parisTimeZone = 'Europe/Paris';
const millisecondsPerMinute = 60_000;
const millisecondsPerDay = 24 * 60 * millisecondsPerMinute;
const maximumPeriodsCount = 100;

export function createEmptyOnDutyPeriodDraft(now: Date): OnDutyPeriodDraft {
	return { day: toParisCalendarDate(now), startTime: '19:00', endTime: '08:00' };
}

export function toOnDutyPeriodDraft(period: OnDutyPeriod): OnDutyPeriodDraft {
	const startsAt = new Date(period.startsAt);
	const endsAt = new Date(period.endsAt);
	return { day: toParisCalendarDate(startsAt), startTime: toParisTime(startsAt), endTime: toParisTime(endsAt) };
}

export function toOnDutyPeriod(draft: OnDutyPeriodDraft): OnDutyPeriod | undefined {
	if (!isValidDraft(draft)) return undefined;
	const endsOnNextDay = draft.endTime <= draft.startTime;
	const endDay = endsOnNextDay ? addOneDay(draft.day) : draft.day;
	return { startsAt: toParisIsoTimestamp(draft.day, draft.startTime), endsAt: toParisIsoTimestamp(endDay, draft.endTime) };
}

/** Chronologique, sans les gardes déjà terminées : elles n'ont plus rien à faire sur le site. */
export function readOnDutyPeriodDrafts(drafts: OnDutyPeriodDraft[], now: Date): OnDutyPeriodsReading {
	if (drafts.length > maximumPeriodsCount) return { success: false, formError: `Au plus ${maximumPeriodsCount} gardes.` };
	const periods = drafts.map(toOnDutyPeriod);
	if (periods.some((period) => period === undefined)) return { success: false, formError: 'Chaque garde a besoin d’un jour et de deux heures différentes.' };
	return { success: true, periods: keepUpcomingPeriods(periods.filter((period) => period !== undefined), now) };
}

export function keepUpcomingPeriods(periods: OnDutyPeriod[], now: Date): OnDutyPeriod[] {
	return periods
		.filter((period) => new Date(period.endsAt) > now)
		.toSorted((first, second) => new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime());
}

const OnDutyPeriodDraftsSchema = v.pipe(
	v.array(
		v.object({
			day: v.pipe(v.string(), v.isoDate()),
			startTime: v.pipe(v.string(), v.isoTime()),
			endTime: v.pipe(v.string(), v.isoTime())
		})
	),
	v.maxLength(maximumPeriodsCount)
);

/** La liste arrive du formulaire en JSON ; `undefined` si elle ne ressemble pas à ce que l'écran envoie. */
export function parseOnDutyPeriodDrafts(json: string): OnDutyPeriodDraft[] | undefined {
	try {
		const parsing = v.safeParse(OnDutyPeriodDraftsSchema, JSON.parse(json));
		return parsing.success ? parsing.output : undefined;
	} catch {
		return undefined;
	}
}

function isValidDraft(draft: OnDutyPeriodDraft): boolean {
	return v.is(v.pipe(v.string(), v.isoDate()), draft.day) && v.is(v.pipe(v.string(), v.isoTime()), draft.startTime) && v.is(v.pipe(v.string(), v.isoTime()), draft.endTime) && draft.startTime !== draft.endTime;
}

function toParisCalendarDate(instant: Date): string {
	return new Intl.DateTimeFormat('en-CA', { timeZone: parisTimeZone }).format(instant);
}

function toParisTime(instant: Date): string {
	return new Intl.DateTimeFormat('fr-FR', { timeZone: parisTimeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(instant);
}

function addOneDay(day: string): string {
	return new Date(new Date(`${day}T00:00:00Z`).getTime() + millisecondsPerDay).toISOString().slice(0, 10);
}

// Paris change d'heure : le décalage se lit à l'instant visé, pas à un instant approché.
function toParisIsoTimestamp(day: string, time: string): string {
	const wallClockAsUtc = new Date(`${day}T${time.slice(0, 5)}:00Z`).getTime();
	const approximateOffset = readParisOffsetInMinutes(new Date(wallClockAsUtc));
	const offsetInMinutes = readParisOffsetInMinutes(new Date(wallClockAsUtc - approximateOffset * millisecondsPerMinute));
	const sign = offsetInMinutes < 0 ? '-' : '+';
	const absoluteOffset = Math.abs(offsetInMinutes);
	const offsetLabel = `${sign}${String(Math.floor(absoluteOffset / 60)).padStart(2, '0')}:${String(absoluteOffset % 60).padStart(2, '0')}`;
	return `${day}T${time.slice(0, 5)}:00${offsetLabel}`;
}

function readParisOffsetInMinutes(instant: Date): number {
	const offsetText = new Intl.DateTimeFormat('en-US', { timeZone: parisTimeZone, timeZoneName: 'longOffset' })
		.formatToParts(instant)
		.find((part) => part.type === 'timeZoneName')?.value;
	const match = /GMT([+-])(\d{2}):(\d{2})/.exec(offsetText ?? '');
	if (!match) return 0;
	const minutes = Number(match[2]) * 60 + Number(match[3]);
	return match[1] === '-' ? -minutes : minutes;
}

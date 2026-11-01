import { getPharmacyProfile } from '@crystal-pharm/pharmacy-db';
import * as v from 'valibot';
import { largestRequiredCount, listPeakDaysOfWeek, type NewPeakWindow, type PeakDay } from '../../../domain/peaks/peakSlots';
import { listPeakWindows, replacePeakWindows } from '../../repositories/peakWindowRepository';
import { findPlanningRules } from '../../repositories/planningSettingsRepository';

export type PeakWindowChangeResult = { isSaved: true } | { isSaved: false; message: string };

/** L'effectif permanent (la règle « personnes présentes au minimum ») et la semaine découpée par-dessus. */
export type PeakWeek = { hasOpeningHours: boolean; baseRequiredCount: number; days: PeakDay[] };

// Une semaine découpée en demi-heures n'en compte jamais autant : au-delà, ce n'est pas l'éditeur qui envoie.
const largestPeakWindowCount = 7 * 48;

const PeakWindowSchema = v.pipe(
	v.object({
		weekday: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(6)),
		startTime: v.pipe(v.string(), v.isoTime()),
		endTime: v.pipe(v.string(), v.isoTime()),
		requiredCount: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(largestRequiredCount))
	}),
	v.check(({ startTime, endTime }) => startTime < endTime)
);

const PeakWeekSchema = v.pipe(
	v.array(PeakWindowSchema),
	v.maxLength(largestPeakWindowCount),
	v.check((peakWindows) => !hasOverlappingPeakWindows(peakWindows))
);

function hasOverlappingPeakWindows(peakWindows: readonly NewPeakWindow[]): boolean {
	return peakWindows.some((peakWindow, index) =>
		peakWindows.some(
			(otherPeakWindow, otherIndex) =>
				otherIndex !== index &&
				otherPeakWindow.weekday === peakWindow.weekday &&
				otherPeakWindow.startTime < peakWindow.endTime &&
				peakWindow.startTime < otherPeakWindow.endTime
		)
	);
}

/** La semaine telle que l'éditeur la montre : chaque jour découpé dans ses heures d'ouverture. */
export async function findPeakWeek(tenantId: string): Promise<PeakWeek> {
	const [{ weeklyOpeningSchedule }, peakWindows, { minimumPeoplePresent }] = await Promise.all([
		getPharmacyProfile(tenantId),
		listPeakWindows(tenantId),
		findPlanningRules(tenantId)
	]);
	return {
		hasOpeningHours: weeklyOpeningSchedule !== undefined,
		baseRequiredCount: minimumPeoplePresent,
		days: listPeakDaysOfWeek(weeklyOpeningSchedule, peakWindows, minimumPeoplePresent)
	};
}

export async function replacePeakWindowsOfWeek(tenantId: string, serializedPeakWindows: string): Promise<PeakWindowChangeResult> {
	const parsed = v.safeParse(PeakWeekSchema, parseJson(serializedPeakWindows));
	if (!parsed.success) return { isSaved: false, message: 'Les heures d’affluence n’ont pas pu être lues. Rechargez la page et recommencez.' };
	await replacePeakWindows(tenantId, parsed.output);
	return { isSaved: true };
}

function parseJson(text: string): unknown {
	try {
		return JSON.parse(text);
	} catch {
		return undefined;
	}
}

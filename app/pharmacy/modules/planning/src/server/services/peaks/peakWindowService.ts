import * as v from 'valibot';
import type { PeakWindow } from '../../../domain/coverage/peakWindows';
import { deletePeakWindow, insertPeakWindow, listPeakWindows } from '../../repositories/peakWindowRepository';

export type PeakWindowSubmission = { weekday: string; startTime: string; endTime: string; requiredCount: string };

export type PeakWindowChangeResult = { isSaved: true } | { isSaved: false; message: string };

const PeakWindowSchema = v.pipe(
	v.object({
		weekday: v.pipe(v.string(), v.regex(/^[0-6]$/, 'Choisissez le jour.'), v.transform(Number)),
		startTime: v.pipe(v.string(), v.isoTime('Heure attendue au format HH:MM.')),
		endTime: v.pipe(v.string(), v.isoTime('Heure attendue au format HH:MM.')),
		requiredCount: v.pipe(v.string(), v.regex(/^\d{1,2}$/, 'Indiquez le nombre de personnes.'), v.transform(Number), v.minValue(1, 'Au moins une personne.'))
	}),
	v.check(({ startTime, endTime }) => startTime < endTime, 'La fin doit venir après le début.')
);

export const findPeakWindows = (tenantId: string): Promise<PeakWindow[]> => listPeakWindows(tenantId);

export async function addPeakWindow(tenantId: string, submission: PeakWindowSubmission): Promise<PeakWindowChangeResult> {
	const parsed = v.safeParse(PeakWindowSchema, submission);
	if (!parsed.success) return { isSaved: false, message: parsed.issues[0].message };
	await insertPeakWindow(tenantId, parsed.output);
	return { isSaved: true };
}

export async function removePeakWindow(tenantId: string, peakWindowId: string): Promise<void> {
	if (!v.is(v.pipe(v.string(), v.uuid()), peakWindowId)) return;
	await deletePeakWindow(tenantId, peakWindowId);
}

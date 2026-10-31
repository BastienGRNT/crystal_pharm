import { formatDayTitle, toIsoDate } from '../../../domain/calendar/week';
import { generateWeek } from '../../../domain/generation/weekGenerator';
import { buildGenerationInput } from '../../../domain/generation/generationInput';
import { findPlannedWeekStatus, savePlannedWeekStatus } from '../../repositories/plannedWeekRepository';
import { insertShift, updateShiftRow } from '../../repositories/planningRepository';
import { loadLiveWeekInput } from '../week/weekIssuesService';

export type WeekGenerationReport = {
	addedCount: number;
	/** Une phrase par créneau posé : qui, et pourquoi lui. */
	explanations: string[];
	/** Ce que personne ne peut tenir : au titulaire de décider. */
	unfilledGaps: string[];
};

/**
 * Propose la semaine du lundi donné en comblant ce qui manque, sans toucher à l'existant.
 * Une semaine encore vide passe en brouillon : le titulaire la relit avant que l'équipe la voie.
 */
export async function generateWeekPlanning(tenantId: string, monday: Date): Promise<WeekGenerationReport> {
	const mondayDate = toIsoDate(monday);
	const [week, status] = await Promise.all([loadLiveWeekInput(tenantId, monday), findPlannedWeekStatus(tenantId, mondayDate)]);
	const result = generateWeek(buildGenerationInput(week));

	for (const { reason: _reason, ...shift } of result.proposedShifts) await insertShift(tenantId, shift);
	for (const { shiftId, reason: _reason, ...shift } of result.extendedShifts) await updateShiftRow(tenantId, shiftId, shift);
	if (status === 'published' && week.shifts.length === 0 && result.proposedShifts.length > 0) {
		await savePlannedWeekStatus(tenantId, mondayDate, 'draft');
	}

	return {
		addedCount: result.proposedShifts.length + result.extendedShifts.length,
		explanations: [...result.proposedShifts, ...result.extendedShifts].map(
			(shift) => `${formatDayTitle(new Date(`${shift.date}T00:00:00Z`))}, ${shift.startTime}–${shift.endTime} · ${shift.reason}`
		),
		unfilledGaps: result.gaps.map((gap) => `${formatDayTitle(new Date(`${gap.date}T00:00:00Z`))} : ${gap.message}`)
	};
}

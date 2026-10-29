import { toIsoDate } from '../../../domain/calendar/week';
import type { PlannedWeekStatus } from '../../db/planningTables';
import { findPlannedWeekStatus, savePlannedWeekStatus } from '../../repositories/plannedWeekRepository';

export type { PlannedWeekStatus };

export function getWeekStatus(tenantId: string, monday: Date): Promise<PlannedWeekStatus> {
	return findPlannedWeekStatus(tenantId, toIsoDate(monday));
}

/** Rend la semaine visible de l'équipe. */
export function publishWeek(tenantId: string, monday: Date): Promise<void> {
	return savePlannedWeekStatus(tenantId, toIsoDate(monday), 'published');
}

/** Remet la semaine en brouillon pour la retravailler sans que l'équipe ne voie les changements. */
export function returnWeekToDraft(tenantId: string, monday: Date): Promise<void> {
	return savePlannedWeekStatus(tenantId, toIsoDate(monday), 'draft');
}

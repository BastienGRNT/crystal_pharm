import { listEmployees } from '@crystal-pharm/pharmacy-db';
import * as v from 'valibot';
import { plannedActivityKinds } from '../../../domain/activities/plannedActivities';
import { deletePlannedActivity, insertPlannedActivity } from '../../repositories/plannedActivityRepository';

export type PlannedActivitySubmission = Record<'employeeId' | 'kind' | 'date' | 'startTime' | 'endTime' | 'label', string>;

export type PlannedActivityChangeResult = { isSaved: true } | { isSaved: false; message: string };

const TimeOfDaySchema = v.pipe(v.string(), v.isoTime('Heure attendue au format HH:MM.'));

const PlannedActivitySubmissionSchema = v.pipe(
	v.object({
		employeeId: v.pipe(v.string(), v.uuid('Choisissez un employé.')),
		kind: v.picklist(plannedActivityKinds, 'Choisissez formation ou astreinte.'),
		date: v.pipe(v.string(), v.isoDate('Choisissez un jour.')),
		startTime: TimeOfDaySchema,
		endTime: TimeOfDaySchema,
		label: v.pipe(v.string(), v.maxLength(80, 'Le libellé est limité à 80 caractères.'))
	}),
	v.check(({ startTime, endTime }) => startTime < endTime, 'La fin doit venir après le début.')
);

/** Le titulaire pose une formation ou une astreinte : le générateur et les alertes en tiennent compte. */
export async function addPlannedActivity(
	tenantId: string,
	submission: PlannedActivitySubmission
): Promise<PlannedActivityChangeResult> {
	const parsed = v.safeParse(PlannedActivitySubmissionSchema, submission);
	if (!parsed.success) return { isSaved: false, message: parsed.issues[0].message };
	// La clé étrangère vers l'employé ne passe pas par la Row-Level Security : c'est ici
	// qu'on refuse l'employé d'une autre pharmacie.
	const employees = await listEmployees(tenantId);
	if (!employees.some((employee) => employee.employeeId === parsed.output.employeeId)) {
		return { isSaved: false, message: 'Cet employé ne fait plus partie de l’équipe.' };
	}
	await insertPlannedActivity(tenantId, { ...parsed.output, label: parsed.output.label.trim() });
	return { isSaved: true };
}

export async function removePlannedActivity(tenantId: string, activityId: string): Promise<void> {
	if (!v.is(v.pipe(v.string(), v.uuid()), activityId)) return;
	await deletePlannedActivity(tenantId, activityId);
}

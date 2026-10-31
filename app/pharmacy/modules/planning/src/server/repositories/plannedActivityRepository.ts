import { and, asc, eq, gte, lte } from 'drizzle-orm';
import type { PlannedActivity } from '../../domain/activities/plannedActivities';
import { runAsTenant, toHoursAndMinutes } from '../db/planningDatabase.server';
import { plannedActivities } from '../db/planningTables';

export type NewPlannedActivity = Omit<PlannedActivity, 'id'>;

export async function listPlannedActivities(tenantId: string, firstDate: string, lastDate: string): Promise<PlannedActivity[]> {
	const rows = await runAsTenant(tenantId, (transaction) =>
		transaction
			.select()
			.from(plannedActivities)
			.where(
				and(
					eq(plannedActivities.tenantId, tenantId),
					gte(plannedActivities.date, firstDate),
					lte(plannedActivities.date, lastDate)
				)
			)
			.orderBy(asc(plannedActivities.date), asc(plannedActivities.startTime))
	);
	return rows.map((row) => ({
		id: row.id,
		employeeId: row.employeeId,
		kind: row.kind,
		date: row.date,
		startTime: toHoursAndMinutes(row.startTime),
		endTime: toHoursAndMinutes(row.endTime),
		label: row.label
	}));
}

export async function insertPlannedActivity(tenantId: string, newActivity: NewPlannedActivity): Promise<void> {
	await runAsTenant(tenantId, (transaction) =>
		transaction.insert(plannedActivities).values({ id: crypto.randomUUID(), tenantId, ...newActivity })
	);
}

export async function deletePlannedActivity(tenantId: string, activityId: string): Promise<void> {
	await runAsTenant(tenantId, (transaction) =>
		transaction
			.delete(plannedActivities)
			.where(and(eq(plannedActivities.tenantId, tenantId), eq(plannedActivities.id, activityId)))
	);
}

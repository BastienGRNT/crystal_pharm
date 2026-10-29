import { and, eq } from 'drizzle-orm';
import { runAsTenant } from '../db/planningDatabase.server';
import { plannedWeeks, type PlannedWeekStatus } from '../db/planningTables';

/** Une semaine jamais préparée est modifiable librement : elle compte comme publiée. */
export async function findPlannedWeekStatus(tenantId: string, mondayDate: string): Promise<PlannedWeekStatus> {
	const [weekRow] = await runAsTenant(tenantId, (transaction) =>
		transaction
			.select()
			.from(plannedWeeks)
			.where(and(eq(plannedWeeks.tenantId, tenantId), eq(plannedWeeks.mondayDate, mondayDate)))
	);
	return weekRow?.status ?? 'published';
}

export async function savePlannedWeekStatus(
	tenantId: string,
	mondayDate: string,
	status: PlannedWeekStatus
): Promise<void> {
	const publishedAt = status === 'published' ? new Date() : null;
	await runAsTenant(tenantId, (transaction) =>
		transaction
			.insert(plannedWeeks)
			.values({ tenantId, mondayDate, status, publishedAt })
			.onConflictDoUpdate({
				target: [plannedWeeks.tenantId, plannedWeeks.mondayDate],
				set: { status, publishedAt, updatedAt: new Date() }
			})
	);
}

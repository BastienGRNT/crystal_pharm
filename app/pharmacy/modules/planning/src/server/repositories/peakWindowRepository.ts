import { and, asc, eq } from 'drizzle-orm';
import type { PeakWindow } from '../../domain/coverage/peakWindows';
import { runAsTenant, toHoursAndMinutes } from '../db/planningDatabase.server';
import { peakWindows } from '../db/planningTables';

export type NewPeakWindow = Omit<PeakWindow, 'id'>;

export async function listPeakWindows(tenantId: string): Promise<PeakWindow[]> {
	const rows = await runAsTenant(tenantId, (transaction) =>
		transaction
			.select()
			.from(peakWindows)
			.where(eq(peakWindows.tenantId, tenantId))
			.orderBy(asc(peakWindows.weekday), asc(peakWindows.startTime))
	);
	return rows.map((row) => ({
		id: row.id,
		weekday: row.weekday,
		startTime: toHoursAndMinutes(row.startTime),
		endTime: toHoursAndMinutes(row.endTime),
		requiredCount: row.requiredCount
	}));
}

export async function insertPeakWindow(tenantId: string, newPeakWindow: NewPeakWindow): Promise<void> {
	await runAsTenant(tenantId, (transaction) =>
		transaction.insert(peakWindows).values({ id: crypto.randomUUID(), tenantId, ...newPeakWindow })
	);
}

export async function deletePeakWindow(tenantId: string, peakWindowId: string): Promise<void> {
	await runAsTenant(tenantId, (transaction) =>
		transaction.delete(peakWindows).where(and(eq(peakWindows.tenantId, tenantId), eq(peakWindows.id, peakWindowId)))
	);
}

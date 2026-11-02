import { asc, eq } from 'drizzle-orm';
import type { PeakWindow } from '../../domain/coverage/peakWindows';
import type { NewPeakWindow } from '../../domain/peaks/peakSlots';
import { runAsTenant, toHoursAndMinutes } from '../db/planningDatabase.server';
import { peakWindows } from '../db/planningTables';

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

/** Toute la semaine d'un coup : ce qui n'est plus dans la liste disparaît, dans la même transaction. */
export async function replacePeakWindows(tenantId: string, newPeakWindows: readonly NewPeakWindow[]): Promise<void> {
	await runAsTenant(tenantId, async (transaction) => {
		await transaction.delete(peakWindows).where(eq(peakWindows.tenantId, tenantId));
		if (newPeakWindows.length === 0) return;
		await transaction.insert(peakWindows).values(newPeakWindows.map((newPeakWindow) => ({ id: crypto.randomUUID(), tenantId, ...newPeakWindow })));
	});
}

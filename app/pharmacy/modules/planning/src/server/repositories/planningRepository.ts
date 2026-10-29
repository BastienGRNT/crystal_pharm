import { and, eq, gte, lte } from 'drizzle-orm';
import type { Absence, Shift } from '../../domain/planning';
import { runAsTenant } from '../db/planningDatabase.server';
import { absences, shifts } from '../db/planningTables';

export type NewShift = Omit<Shift, 'id'>;
export type NewAbsence = Omit<Absence, 'id'>;

// Postgres rend une heure en « 08:30:00 » : le planning n'en garde que « 08:30 ».
const toHoursAndMinutes = (storedTime: string): string => storedTime.slice(0, 5);

export async function listShifts(tenantId: string, firstDate: string, lastDate: string): Promise<Shift[]> {
	const shiftRows = await runAsTenant(tenantId, (transaction) =>
		transaction
			.select()
			.from(shifts)
			.where(and(eq(shifts.tenantId, tenantId), gte(shifts.date, firstDate), lte(shifts.date, lastDate)))
	);
	return shiftRows.map((shiftRow) => ({
		id: shiftRow.id,
		employeeId: shiftRow.employeeId,
		date: shiftRow.date,
		startTime: toHoursAndMinutes(shiftRow.startTime),
		endTime: toHoursAndMinutes(shiftRow.endTime)
	}));
}

/** Les absences qui touchent la période, même si elles commencent avant ou finissent après. */
export async function listAbsences(tenantId: string, firstDate: string, lastDate: string): Promise<Absence[]> {
	const absenceRows = await runAsTenant(tenantId, (transaction) =>
		transaction
			.select()
			.from(absences)
			.where(
				and(eq(absences.tenantId, tenantId), lte(absences.firstDate, lastDate), gte(absences.lastDate, firstDate))
			)
	);
	return absenceRows.map((absenceRow) => ({
		id: absenceRow.id,
		employeeId: absenceRow.employeeId,
		firstDate: absenceRow.firstDate,
		lastDate: absenceRow.lastDate,
		kind: absenceRow.kind
	}));
}

export async function insertShift(tenantId: string, newShift: NewShift): Promise<void> {
	await runAsTenant(tenantId, (transaction) =>
		transaction.insert(shifts).values({ id: crypto.randomUUID(), tenantId, ...newShift })
	);
}

export async function insertAbsence(tenantId: string, newAbsence: NewAbsence): Promise<void> {
	await runAsTenant(tenantId, (transaction) =>
		transaction.insert(absences).values({ id: crypto.randomUUID(), tenantId, ...newAbsence })
	);
}

export async function deleteShift(tenantId: string, shiftId: string): Promise<void> {
	await runAsTenant(tenantId, (transaction) =>
		transaction.delete(shifts).where(and(eq(shifts.tenantId, tenantId), eq(shifts.id, shiftId)))
	);
}

export async function updateShiftRow(tenantId: string, shiftId: string, changes: NewShift): Promise<void> {
	await runAsTenant(tenantId, (transaction) =>
		transaction
			.update(shifts)
			.set(changes)
			.where(and(eq(shifts.tenantId, tenantId), eq(shifts.id, shiftId)))
	);
}

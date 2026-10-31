import { and, asc, desc, eq, gte } from 'drizzle-orm';
import type { AbsenceStatus, LeaveRequest } from '../../domain/leave/leaveRequests';
import { runAsTenant } from '../db/planningDatabase.server';
import { absences } from '../db/planningTables';

export type NewLeaveRequest = Omit<LeaveRequest, 'id' | 'status'>;

function toLeaveRequest(row: typeof absences.$inferSelect): LeaveRequest {
	return {
		id: row.id,
		employeeId: row.employeeId,
		firstDate: row.firstDate,
		lastDate: row.lastDate,
		kind: row.kind,
		status: row.status,
		note: row.note
	};
}

/** Les congés d'un employé qui ne sont pas encore finis, les plus proches d'abord. */
export async function listUpcomingLeaveRequestsOfEmployee(
	tenantId: string,
	employeeId: string,
	today: string
): Promise<LeaveRequest[]> {
	const rows = await runAsTenant(tenantId, (transaction) =>
		transaction
			.select()
			.from(absences)
			.where(and(eq(absences.tenantId, tenantId), eq(absences.employeeId, employeeId), gte(absences.lastDate, today)))
			.orderBy(asc(absences.firstDate))
	);
	return rows.map(toLeaveRequest);
}

export async function listPendingLeaveRequests(tenantId: string): Promise<LeaveRequest[]> {
	const rows = await runAsTenant(tenantId, (transaction) =>
		transaction
			.select()
			.from(absences)
			.where(and(eq(absences.tenantId, tenantId), eq(absences.status, 'pending')))
			.orderBy(desc(absences.createdAt))
	);
	return rows.map(toLeaveRequest);
}

export async function findLeaveRequest(tenantId: string, leaveRequestId: string): Promise<LeaveRequest | undefined> {
	const [row] = await runAsTenant(tenantId, (transaction) =>
		transaction
			.select()
			.from(absences)
			.where(and(eq(absences.tenantId, tenantId), eq(absences.id, leaveRequestId)))
	);
	return row && toLeaveRequest(row);
}

export async function insertLeaveRequest(tenantId: string, newLeaveRequest: NewLeaveRequest): Promise<string> {
	const id = crypto.randomUUID();
	await runAsTenant(tenantId, (transaction) =>
		transaction.insert(absences).values({ id, tenantId, ...newLeaveRequest, status: 'pending' })
	);
	return id;
}

export async function updateLeaveRequestStatus(tenantId: string, leaveRequestId: string, status: AbsenceStatus): Promise<void> {
	await runAsTenant(tenantId, (transaction) =>
		transaction
			.update(absences)
			.set({ status, decidedAt: new Date() })
			.where(and(eq(absences.tenantId, tenantId), eq(absences.id, leaveRequestId)))
	);
}

export async function deleteLeaveRequest(tenantId: string, leaveRequestId: string): Promise<void> {
	await runAsTenant(tenantId, (transaction) =>
		transaction.delete(absences).where(and(eq(absences.tenantId, tenantId), eq(absences.id, leaveRequestId)))
	);
}

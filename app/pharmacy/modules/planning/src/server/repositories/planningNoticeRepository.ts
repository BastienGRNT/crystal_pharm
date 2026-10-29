import { and, desc, eq, isNull } from 'drizzle-orm';
import { runAsTenant } from '../db/planningDatabase.server';
import { planningNotices, type PlanningNoticeKind } from '../db/planningTables';

export type PlanningNotice = {
	id: string;
	kind: PlanningNoticeKind;
	message: string;
	linkPathname: string;
	isRead: boolean;
	createdAt: Date;
};

export type NewPlanningNotice = { recipientAccountId: string; kind: PlanningNoticeKind; message: string; linkPathname: string };

export async function insertPlanningNotices(tenantId: string, newNotices: NewPlanningNotice[]): Promise<void> {
	if (newNotices.length === 0) return;
	await runAsTenant(tenantId, (transaction) =>
		transaction.insert(planningNotices).values(newNotices.map((notice) => ({ id: crypto.randomUUID(), tenantId, ...notice })))
	);
}

export async function listPlanningNoticesOfAccount(tenantId: string, accountId: string, limit = 20): Promise<PlanningNotice[]> {
	const rows = await runAsTenant(tenantId, (transaction) =>
		transaction
			.select()
			.from(planningNotices)
			.where(and(eq(planningNotices.tenantId, tenantId), eq(planningNotices.recipientAccountId, accountId)))
			.orderBy(desc(planningNotices.createdAt))
			.limit(limit)
	);
	return rows.map((row) => ({
		id: row.id,
		kind: row.kind,
		message: row.message,
		linkPathname: row.linkPathname,
		isRead: row.readAt !== null,
		createdAt: row.createdAt
	}));
}

export async function markPlanningNoticesAsRead(tenantId: string, accountId: string): Promise<void> {
	await runAsTenant(tenantId, (transaction) =>
		transaction
			.update(planningNotices)
			.set({ readAt: new Date() })
			.where(
				and(
					eq(planningNotices.tenantId, tenantId),
					eq(planningNotices.recipientAccountId, accountId),
					isNull(planningNotices.readAt)
				)
			)
	);
}

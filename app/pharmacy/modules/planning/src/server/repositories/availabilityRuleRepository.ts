import { and, asc, eq, inArray } from 'drizzle-orm';
import type { AvailabilityRule, AvailabilityStatus } from '../../domain/availability/availabilityRules';
import { runAsTenant, toHoursAndMinutes } from '../db/planningDatabase.server';
import { availabilityRules } from '../db/planningTables';

export type NewAvailabilityRule = Omit<AvailabilityRule, 'id'>;

function toRule(row: typeof availabilityRules.$inferSelect): AvailabilityRule {
	return {
		id: row.id,
		employeeId: row.employeeId,
		kind: row.kind,
		weekday: row.weekday ?? undefined,
		date: row.date ?? undefined,
		startTime: toHoursAndMinutes(row.startTime),
		endTime: toHoursAndMinutes(row.endTime),
		status: row.status,
		note: row.note
	};
}

export async function listAvailabilityRules(tenantId: string, statuses?: readonly AvailabilityStatus[]): Promise<AvailabilityRule[]> {
	const rows = await runAsTenant(tenantId, (transaction) =>
		transaction
			.select()
			.from(availabilityRules)
			.where(
				statuses
					? and(eq(availabilityRules.tenantId, tenantId), inArray(availabilityRules.status, [...statuses]))
					: eq(availabilityRules.tenantId, tenantId)
			)
			.orderBy(asc(availabilityRules.createdAt))
	);
	return rows.map(toRule);
}

export async function listAvailabilityRulesOfEmployee(tenantId: string, employeeId: string): Promise<AvailabilityRule[]> {
	const rows = await runAsTenant(tenantId, (transaction) =>
		transaction
			.select()
			.from(availabilityRules)
			.where(and(eq(availabilityRules.tenantId, tenantId), eq(availabilityRules.employeeId, employeeId)))
			.orderBy(asc(availabilityRules.createdAt))
	);
	return rows.map(toRule);
}

export async function findAvailabilityRule(tenantId: string, ruleId: string): Promise<AvailabilityRule | undefined> {
	const [row] = await runAsTenant(tenantId, (transaction) =>
		transaction
			.select()
			.from(availabilityRules)
			.where(and(eq(availabilityRules.tenantId, tenantId), eq(availabilityRules.id, ruleId)))
	);
	return row && toRule(row);
}

export async function insertAvailabilityRule(tenantId: string, newRule: NewAvailabilityRule): Promise<void> {
	await runAsTenant(tenantId, (transaction) =>
		transaction.insert(availabilityRules).values({
			id: crypto.randomUUID(),
			tenantId,
			...newRule,
			decidedAt: newRule.status === 'pending' ? null : new Date()
		})
	);
}

export async function updateAvailabilityRuleStatus(tenantId: string, ruleId: string, status: AvailabilityStatus): Promise<void> {
	await runAsTenant(tenantId, (transaction) =>
		transaction
			.update(availabilityRules)
			.set({ status, decidedAt: new Date() })
			.where(and(eq(availabilityRules.tenantId, tenantId), eq(availabilityRules.id, ruleId)))
	);
}

export async function deleteAvailabilityRule(tenantId: string, ruleId: string): Promise<void> {
	await runAsTenant(tenantId, (transaction) =>
		transaction.delete(availabilityRules).where(and(eq(availabilityRules.tenantId, tenantId), eq(availabilityRules.id, ruleId)))
	);
}

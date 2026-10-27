import { connectToDatabase } from '@crystal-pharm/auth/toolkit';
import { sql } from 'drizzle-orm';
import { isToolKey, type ToolKey } from '../tools/tools';
import { summarizeToolAccess, type ToolAccessLine, type ToolAccessSummary } from './toolAccessSummary';

type ToolAccessRow = { tool_key: string; paid_until: Date | string; ends_at: Date | string };

/**
 * Ce à quoi une pharmacie a droit : une seule instruction, sans transaction
 * explicite ni cache. `billing.read_tool_access` pose elle-même le contexte
 * de la Row-Level Security, puis lit `tenant_tool_access` par son index.
 */
export async function readToolAccessLines(tenantId: string): Promise<ToolAccessLine[]> {
	const rows = await connectToDatabase().execute<ToolAccessRow>(
		sql`select tool_key, paid_until, ends_at from billing.read_tool_access(${tenantId}::uuid)`
	);
	return [...rows]
		.filter((row): row is ToolAccessRow & { tool_key: ToolKey } => isToolKey(row.tool_key))
		.map((row) => ({ toolKey: row.tool_key, paidUntil: new Date(row.paid_until), endsAt: new Date(row.ends_at) }));
}

export async function getToolAccessSummary(tenantId: string, now = new Date()): Promise<ToolAccessSummary> {
	return summarizeToolAccess(await readToolAccessLines(tenantId), now);
}

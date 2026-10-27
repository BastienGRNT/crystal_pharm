import { shiftGroupDatesBackOneMonth } from '@crystal-pharm/group-db';
import { sql } from 'drizzle-orm';
import { platformBillingAccess, runWithBillingAccess, type BillingTransaction } from '../database/billingDatabase.server';
import { runDueBilling, type DueBillingReport } from './dueBilling.server';

const billingDateColumnsByTable: Record<string, string[]> = {
	tenant_subscriptions: ['started_at', 'cancelled_at', 'ends_at', 'billed_until', 'first_failed_at', 'next_retry_at'],
	tenant_subscription_items: ['started_at', 'ends_at'],
	tenant_tool_access: ['starts_at', 'paid_until', 'ends_at'],
	group_contract_versions: ['starts_at', 'ends_at'],
	price_agreements: ['starts_at', 'ends_at'],
	group_contracts: ['activated_at', 'billed_until'],
	payments: ['paid_at', 'refunded_at'],
	invoices: ['issued_at', 'period_start', 'period_end', 'paid_at'],
	checkouts: ['created_at', 'completed_at']
};

/**
 * Outil de dev : fait comme si un mois était passé. Toutes les dates de
 * facturation (et des adhésions) reculent d'un mois, puis le renouvellement
 * mensuel passe : prélèvements, factures, fins de prise en charge.
 */
export async function simulateOneMonthLater(): Promise<DueBillingReport> {
	await runWithBillingAccess(platformBillingAccess, async (transaction) => {
		await useServerTimeZone(transaction);
		for (const [tableName, columnNames] of Object.entries(billingDateColumnsByTable)) {
			const assignments = columnNames.map((columnName) => `"${columnName}" = "${columnName}" - interval '1 month'`).join(', ');
			await transaction.execute(sql.raw(`update billing."${tableName}" set ${assignments}`));
		}
	});
	await shiftGroupDatesBackOneMonth();
	return runDueBilling();
}

// Les périodes sont calculées sur le calendrier du serveur (`setMonth`) : le
// recul d'un mois se fait dans le même fuseau, sinon un changement d'heure
// décalerait les échéances d'une heure.
async function useServerTimeZone(transaction: BillingTransaction): Promise<void> {
	const serverTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	await transaction.execute(sql`select set_config('timezone', ${serverTimeZone}, true)`);
}

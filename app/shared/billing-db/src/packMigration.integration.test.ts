import { existsSync, readFileSync } from 'node:fs';
import postgres from 'postgres';
import { afterAll, describe, expect, it } from 'vitest';
import { quoteTools } from './pricing/toolPricing';
import { sellableToolKeys, type ToolKey } from './tools/tools';

// Se lance avec `pnpm --filter @crystal-pharm/billing-db test:integration`,
// Postgres démarré (`make start`) et migré (`make migrate`). Tout se passe dans
// une transaction annulée : le catalogue et les abonnements du développement ne bougent pas.
const repositoryEnvironmentFile = new URL('../../../../.env', import.meta.url);
if (existsSync(repositoryEnvironmentFile)) process.loadEnvFile(repositoryEnvironmentFile);

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is missing from the environment.');

const database = postgres(databaseUrl, { max: 1 });
const packTenantId = '00000000-0000-4000-9000-0000000000d1';
const partialTenantId = '00000000-0000-4000-9000-0000000000d2';
const migrationFile = new URL('./database/migrations/0008_migrate_tools_to_offers_and_build_tool_access.sql', import.meta.url);
const monthInMilliseconds = 30 * 24 * 60 * 60 * 1000;

class RollbackAfterTest extends Error {}

const toolPriceCents = new Map<ToolKey, number>(sellableToolKeys.map((toolKey, toolIndex) => [toolKey, 1000 * (toolIndex + 1)]));
const listTotalCents = [...toolPriceCents.values()].reduce((total, priceCents) => total + priceCents, 0);
const packPriceCents = listTotalCents - 700;

async function inRolledBackTransaction(test: (transaction: postgres.TransactionSql) => Promise<void>): Promise<void> {
	try {
		await database.begin(async (transaction) => {
			await test(transaction);
			throw new RollbackAfterTest();
		});
	} catch (error) {
		if (!(error instanceof RollbackAfterTest)) throw error;
	}
}

async function writeOldCatalog(transaction: postgres.TransactionSql): Promise<void> {
	await transaction`delete from billing.tenant_subscription_items`;
	await transaction`delete from billing.offer_version_tools`;
	await transaction`delete from billing.offer_versions`;
	await transaction`delete from billing.tool_prices`;
	for (const [toolKey, priceCents] of toolPriceCents) {
		await transaction`insert into billing.tool_prices (tool_key, monthly_price_cents) values (${toolKey}, ${priceCents})`;
	}
	await transaction`insert into billing.catalog_settings (id, pack_monthly_price_cents) values (1, ${packPriceCents})
		on conflict (id) do update set pack_monthly_price_cents = ${packPriceCents}`;
}

async function subscribeToTools(transaction: postgres.TransactionSql, tenantId: string, toolKeys: readonly ToolKey[]): Promise<void> {
	const startedAt = new Date(Date.now() - monthInMilliseconds);
	await transaction`insert into pharmacy.tenants (id, name, street, postal_code, city, phone_number)
		values (${tenantId}, ${tenantId}, '1 rue de la Paix', '75002', 'Paris', '0123456789')`;
	const [subscription] = await transaction`insert into billing.tenant_subscriptions (id, tenant_id, started_at)
		values (gen_random_uuid(), ${tenantId}, ${startedAt}) returning id`;
	for (const toolKey of toolKeys) {
		await transaction`insert into billing.tenant_subscription_tools (tenant_id, subscription_id, tool_key, added_at)
			values (${tenantId}, ${subscription?.id}, ${toolKey}, ${startedAt})`;
	}
}

function computeMonthlyAmountBeforeMigration(toolKeys: readonly ToolKey[]): number {
	const toolPrices = [...toolPriceCents].map(([toolKey, monthlyPriceCents]) => ({ toolKey, monthlyPriceCents }));
	const catalog = { toolPrices, packMonthlyPriceCents: packPriceCents, annualFreeMonths: 2 };
	return quoteTools({ catalog, coverages: [], selectedToolKeys: toolKeys }).pharmacyMonthlyTotalCents;
}

async function runMigrationDataStatements(transaction: postgres.TransactionSql): Promise<void> {
	const statements = readFileSync(migrationFile, 'utf8').split('--> statement-breakpoint');
	for (const statement of statements) {
		const isIndependentOfSubscriptions = statement.includes('CREATE FUNCTION') || statement.includes('billing.group_contract_versions');
		if (isIndependentOfSubscriptions) continue;
		await transaction.unsafe(statement);
	}
}

async function readMonthlyAmountAfterMigration(transaction: postgres.TransactionSql, tenantId: string): Promise<number> {
	const [total] = await transaction`select coalesce(sum(billed_monthly_price_cents), 0)::int as total_cents
		from billing.tenant_subscription_items where tenant_id = ${tenantId} and ends_at is null`;
	return total?.total_cents;
}

afterAll(async () => {
	await database.end();
});

describe('la migration 0008 garde le montant des abonnements', () => {
	it('une pharmacie au pack paie le même montant avant et après, sur une seule ligne « pack »', async () => {
		await inRolledBackTransaction(async (transaction) => {
			await writeOldCatalog(transaction);
			await subscribeToTools(transaction, packTenantId, sellableToolKeys);
			const amountBeforeCents = computeMonthlyAmountBeforeMigration(sellableToolKeys);
			expect(amountBeforeCents).toBe(packPriceCents);

			await runMigrationDataStatements(transaction);

			expect(await readMonthlyAmountAfterMigration(transaction, packTenantId)).toBe(amountBeforeCents);
			const packItems = await transaction`select offer_versions.offer_key from billing.tenant_subscription_items as items
				join billing.offer_versions on offer_versions.id = items.offer_version_id where items.tenant_id = ${packTenantId}`;
			expect(packItems.map(({ offer_key }) => offer_key)).toEqual(['pack']);
			const packTools = await transaction`select offer_version_tools.tool_key from billing.offer_version_tools
				join billing.offer_versions on offer_versions.id = offer_version_tools.offer_version_id where offer_versions.offer_key = 'pack'`;
			expect(packTools.map(({ tool_key }) => tool_key).toSorted()).toEqual([...sellableToolKeys].toSorted());
		});
	});

	it('une pharmacie qui n’a qu’une partie des Tools paie le même montant, Tool par Tool', async () => {
		await inRolledBackTransaction(async (transaction) => {
			const partialToolKeys = sellableToolKeys.slice(0, -1);
			await writeOldCatalog(transaction);
			await subscribeToTools(transaction, partialTenantId, partialToolKeys);
			const amountBeforeCents = computeMonthlyAmountBeforeMigration(partialToolKeys);

			await runMigrationDataStatements(transaction);

			expect(await readMonthlyAmountAfterMigration(transaction, partialTenantId)).toBe(amountBeforeCents);
		});
	});
});

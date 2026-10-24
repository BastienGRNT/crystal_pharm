import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

type ContentDatabase = ReturnType<typeof createContentDatabase>;
export type ContentTransaction = Parameters<Parameters<ContentDatabase['transaction']>[0]>[0];

// `content-db` ne dépend que d'`engine/schema` : il ne peut pas reprendre la
// connexion de `shared/auth`, et ouvre donc sa propre réserve de connexions.
function createContentDatabase() {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) throw new Error('DATABASE_URL is missing from the environment.');
	return drizzle(postgres(databaseUrl));
}

let sharedContentDatabase: ContentDatabase | undefined;

function runWithSettings<Result>(
	settings: Record<string, string>,
	work: (transaction: ContentTransaction) => Promise<Result>
): Promise<Result> {
	sharedContentDatabase ??= createContentDatabase();
	return sharedContentDatabase.transaction(async (transaction) => {
		for (const [settingName, value] of Object.entries(settings)) {
			await transaction.execute(sql`select set_config(${settingName}, ${value}, true)`);
		}
		return work(transaction);
	});
}

/** Une transaction limitée par la Row-Level Security au Tenant donné. */
export function runAsTenant<Result>(
	tenantId: string,
	work: (transaction: ContentTransaction) => Promise<Result>
): Promise<Result> {
	return runWithSettings({ 'app.tenant_id': tenantId }, work);
}

/** Une transaction de la passerelle : elle ne voit que l'adresse demandée, pas encore le Tenant. */
export function runAsSiteGateway<Result>(
	requestedSubdomain: string,
	work: (transaction: ContentTransaction) => Promise<Result>
): Promise<Result> {
	return runWithSettings({ 'app.requested_subdomain': requestedSubdomain }, work);
}

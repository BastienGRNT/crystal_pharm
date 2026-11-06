import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

type SiteTrafficDatabase = ReturnType<typeof createSiteTrafficDatabase>;
export type SiteTrafficTransaction = Parameters<Parameters<SiteTrafficDatabase['transaction']>[0]>[0];

// `site-traffic-db` ne dépend d'aucun autre package : il ouvre sa propre réserve de connexions.
function createSiteTrafficDatabase() {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) throw new Error('DATABASE_URL is missing from the environment.');
	return drizzle(postgres(databaseUrl, { max: 2 }));
}

let sharedSiteTrafficDatabase: SiteTrafficDatabase | undefined;

/** Une transaction limitée par la Row-Level Security au Tenant donné. */
export function runAsTenant<Result>(
	tenantId: string,
	work: (transaction: SiteTrafficTransaction) => Promise<Result>
): Promise<Result> {
	sharedSiteTrafficDatabase ??= createSiteTrafficDatabase();
	return sharedSiteTrafficDatabase.transaction(async (transaction) => {
		await transaction.execute(sql`select set_config('app.tenant_id', ${tenantId}, true)`);
		return work(transaction);
	});
}

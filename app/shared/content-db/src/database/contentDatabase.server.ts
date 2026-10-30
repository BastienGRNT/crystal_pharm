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

/** Pour une instruction unique : les fonctions SQL de lecture posent elles-mêmes leur contexte de Row-Level Security. */
export function connectToContentDatabase(): ContentDatabase {
	sharedContentDatabase ??= createContentDatabase();
	return sharedContentDatabase;
}

/** Une transaction limitée par la Row-Level Security au Tenant donné. */
export function runAsTenant<Result>(
	tenantId: string,
	work: (transaction: ContentTransaction) => Promise<Result>
): Promise<Result> {
	return connectToContentDatabase().transaction(async (transaction) => {
		await transaction.execute(sql`select set_config('app.tenant_id', ${tenantId}, true)`);
		return work(transaction);
	});
}

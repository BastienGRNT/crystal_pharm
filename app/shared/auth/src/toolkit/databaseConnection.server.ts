import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { readRequiredEnvironmentVariable } from './environment.server';

type Database = ReturnType<typeof createDatabase>;
export type DatabaseTransaction = Parameters<Parameters<Database['transaction']>[0]>[0];

function createDatabase() {
	return drizzle(postgres(readRequiredEnvironmentVariable('DATABASE_URL')));
}

let sharedDatabase: Database | undefined;

// Une seule réserve de connexions par processus, quel que soit le nombre de
// packages qui la demandent (auth, pharmacy-db, group-db, billing-db…).
export function connectToDatabase(): Database {
	sharedDatabase ??= createDatabase();
	return sharedDatabase;
}

/**
 * Pose des réglages lus par la Row-Level Security (`app.tenant_id`…) pour la
 * seule transaction en cours (`set_config(…, true)`, l'équivalent de `SET LOCAL`).
 */
export async function applyTransactionSettings(
	transaction: DatabaseTransaction,
	settings: Readonly<Record<string, string | undefined>>
): Promise<void> {
	for (const [settingName, settingValue] of Object.entries(settings)) {
		if (settingValue === undefined) continue;
		await transaction.execute(sql`select set_config(${settingName}, ${settingValue}, true)`);
	}
}

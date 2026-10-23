import { connectToDatabase } from '@crystal-pharm/auth/toolkit';
import { sql } from 'drizzle-orm';

type PharmacyDatabase = ReturnType<typeof connectToDatabase>;
export type PharmacyTransaction = Parameters<Parameters<PharmacyDatabase['transaction']>[0]>[0];

let pharmacyDatabase: PharmacyDatabase | undefined;

// Créée au premier appel et non à l'import : `vite build` importe le code
// serveur sans l'environnement d'exécution (base de données).
function getPharmacyDatabase(): PharmacyDatabase {
	pharmacyDatabase ??= connectToDatabase();
	return pharmacyDatabase;
}

/** Une transaction limitée par la Row-Level Security au Tenant donné. */
export function runAsTenant<Result>(
	tenantId: string,
	work: (transaction: PharmacyTransaction) => Promise<Result>
): Promise<Result> {
	return getPharmacyDatabase().transaction(async (transaction) => {
		await transaction.execute(sql`select set_config('app.tenant_id', ${tenantId}, true)`);
		return work(transaction);
	});
}

/** Une transaction limitée par la Row-Level Security aux Tenants dont le compte est membre. */
export function runAsAccount<Result>(
	accountId: string,
	work: (transaction: PharmacyTransaction) => Promise<Result>
): Promise<Result> {
	return getPharmacyDatabase().transaction(async (transaction) => {
		await transaction.execute(sql`select set_config('app.account_id', ${accountId}, true)`);
		return work(transaction);
	});
}

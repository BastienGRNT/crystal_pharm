import { applyTransactionSettings, connectToDatabase, type DatabaseTransaction } from '@crystal-pharm/auth/toolkit';

export type PlanningTransaction = DatabaseTransaction;

/** Une transaction limitée par la Row-Level Security au Tenant donné. */
export function runAsTenant<Result>(
	tenantId: string,
	work: (transaction: PlanningTransaction) => Promise<Result>
): Promise<Result> {
	return connectToDatabase().transaction(async (transaction) => {
		await applyTransactionSettings(transaction, { 'app.tenant_id': tenantId });
		return work(transaction);
	});
}

// Postgres rend une heure en « 08:30:00 » : le planning n'en garde que « 08:30 ».
export function toHoursAndMinutes(storedTime: string): string {
	return storedTime.slice(0, 5);
}

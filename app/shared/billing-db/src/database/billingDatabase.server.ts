import { applyTransactionSettings, connectToDatabase, type DatabaseTransaction } from '@crystal-pharm/auth/toolkit';
import { toGroupAccessSettings, type GroupAccess } from '@crystal-pharm/group-db';

export type BillingTransaction = DatabaseTransaction;

/** Mêmes réglages de Row-Level Security que `groups` : qui agit (Tenant, groupement, Platform…). */
export type BillingAccess = GroupAccess;

export function runWithBillingAccess<Result>(
	access: BillingAccess,
	work: (transaction: BillingTransaction) => Promise<Result>
): Promise<Result> {
	return connectToDatabase().transaction(async (transaction) => {
		await applyTransactionSettings(transaction, toGroupAccessSettings(access));
		return work(transaction);
	});
}

export const platformBillingAccess: BillingAccess = { isPlatform: true };

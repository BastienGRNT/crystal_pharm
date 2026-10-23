import type { AuthenticatedUser } from '@crystal-pharm/auth/toolkit';
import { and, eq } from 'drizzle-orm';
import { runWithBillingAccess, type BillingTransaction } from '../database/billingDatabase.server';
import { termsAcceptances } from '../database/billingTables';
import { currentTermsVersion } from './termsVersion';

export function hasTenantAcceptedCurrentTerms(tenantId: string): Promise<boolean> {
	return runWithBillingAccess({ tenantId }, (transaction) => readCurrentTermsAcceptance(transaction, tenantId));
}

export async function readCurrentTermsAcceptance(transaction: BillingTransaction, tenantId: string): Promise<boolean> {
	const [acceptance] = await transaction
		.select({ id: termsAcceptances.id })
		.from(termsAcceptances)
		.where(and(eq(termsAcceptances.tenantId, tenantId), eq(termsAcceptances.termsVersion, currentTermsVersion)))
		.limit(1);
	return acceptance !== undefined;
}

export async function recordCurrentTermsAcceptance(
	transaction: BillingTransaction,
	tenantId: string,
	acceptingUser: AuthenticatedUser,
	now: Date
): Promise<void> {
	await transaction.insert(termsAcceptances).values({
		id: crypto.randomUUID(),
		tenantId,
		termsVersion: currentTermsVersion,
		acceptedByUserId: acceptingUser.userId,
		acceptedByName: acceptingUser.name,
		acceptedByEmail: acceptingUser.email,
		acceptedAt: now
	});
}

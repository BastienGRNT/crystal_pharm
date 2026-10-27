import { listCoveredTenantIdsOfGroup } from '@crystal-pharm/group-db';
import { eq } from 'drizzle-orm';
import { platformBillingAccess, runWithBillingAccess, type BillingTransaction } from '../database/billingDatabase.server';
import { priceAgreements } from '../database/billingTables';
import {
	finishSubscriptionEvent,
	lockCurrentSubscriptionOfTenant,
	repriceItemsOfSubscription
} from './subscriptionEventSupport.server';

export type PriceAgreementGrant = {
	beneficiary: { tenantId: string } | { groupId: string };
	offerKey: string;
	monthlyPriceCents: number;
	startsAt?: Date;
	/** Vide : l'accord vaut à vie. */
	endsAt?: Date;
};

/** Événement : la Platform accorde un prix négocié. Les lignes concernées sont refixées pour leur prochain renouvellement. */
export async function grantPriceAgreement(grant: PriceAgreementGrant, now: Date): Promise<string> {
	const priceAgreementId = crypto.randomUUID();
	const affectedTenantIds = await listAffectedTenantIds(grant.beneficiary, now);
	await runWithBillingAccess(platformBillingAccess, async (transaction) => {
		await transaction.insert(priceAgreements).values({
			id: priceAgreementId,
			tenantId: 'tenantId' in grant.beneficiary ? grant.beneficiary.tenantId : null,
			groupId: 'groupId' in grant.beneficiary ? grant.beneficiary.groupId : null,
			offerKey: grant.offerKey,
			monthlyPriceCents: grant.monthlyPriceCents,
			startsAt: grant.startsAt ?? now,
			endsAt: grant.endsAt ?? null
		});
		await repriceTenants(transaction, affectedTenantIds, now);
	});
	return priceAgreementId;
}

/** Événement : un accord s'arrête à la date donnée ; les lignes reviennent au prix de leur version au renouvellement suivant. */
export async function endPriceAgreement(priceAgreementId: string, endsAt: Date, now: Date): Promise<void> {
	const beneficiary = await runWithBillingAccess(platformBillingAccess, async (transaction) => {
		const [agreementRow] = await transaction.select().from(priceAgreements).where(eq(priceAgreements.id, priceAgreementId));
		return agreementRow && (agreementRow.tenantId ? { tenantId: agreementRow.tenantId } : { groupId: agreementRow.groupId! });
	});
	if (!beneficiary) return;
	const affectedTenantIds = await listAffectedTenantIds(beneficiary, now);
	await runWithBillingAccess(platformBillingAccess, async (transaction) => {
		await transaction
			.update(priceAgreements)
			.set({ endsAt })
			.where(eq(priceAgreements.id, priceAgreementId));
		await repriceTenants(transaction, affectedTenantIds, now);
	});
}

async function listAffectedTenantIds(beneficiary: PriceAgreementGrant['beneficiary'], now: Date): Promise<string[]> {
	return 'tenantId' in beneficiary ? [beneficiary.tenantId] : listCoveredTenantIdsOfGroup(platformBillingAccess, beneficiary.groupId, now);
}

async function repriceTenants(
	transaction: BillingTransaction,
	tenantIds: readonly string[],
	now: Date
): Promise<void> {
	for (const tenantId of tenantIds) {
		const subscription = await lockCurrentSubscriptionOfTenant(transaction, tenantId, now);
		if (!subscription) continue;
		await repriceItemsOfSubscription(transaction, subscription);
		await finishSubscriptionEvent(transaction, tenantId, now);
	}
}

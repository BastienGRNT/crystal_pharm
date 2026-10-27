import { existsSync } from 'node:fs';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Se lance avec `pnpm --filter @crystal-pharm/billing-db test:integration`,
// Postgres démarré (`make start`) et migré (`make migrate`). Les événements
// valident leur transaction : les données du test sont effacées à la fin.
const repositoryEnvironmentFile = new URL('../../../../.env', import.meta.url);
if (existsSync(repositoryEnvironmentFile)) process.loadEnvFile(repositoryEnvironmentFile);

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is missing from the environment.');

const database = postgres(databaseUrl, { max: 1 });
const tenantId = '00000000-0000-4000-9000-0000000000c1';
const offerKey = 'events-probe-offer';
const dayInMilliseconds = 24 * 60 * 60 * 1000;
const now = new Date();

const { renewSubscription, retryFailedPayment } = await import('./renewal/subscriptionRenewal.server');
const { publishOfferVersion } = await import('./events/offerVersionPublication.server');
const { grantPriceAgreement, endPriceAgreement } = await import('./events/priceAgreementEvents.server');
const { reconcileToolAccessOfTenant } = await import('./access/toolAccessReconciliation.server');
const { readToolAccessLines } = await import('./access/toolAccessReading.server');
const { fakeDeclinedCardReference } = await import('./payments/paymentProvider');

let subscriptionId = '';

async function cleanUp(): Promise<void> {
	await database`delete from pharmacy.tenants where id = ${tenantId}`;
	await database`delete from billing.offers where offer_key = ${offerKey}`;
}

async function createSubscription(cardReference: string | null): Promise<void> {
	await publishOfferVersion({ offerKey, label: 'Offre de test', monthlyPriceCents: 3000, toolKeys: ['planning'] }, now);
	const [version] = await database`select id from billing.offer_versions where offer_key = ${offerKey} and version_number = 1`;
	const billedUntil = new Date(now.getTime() - dayInMilliseconds);
	const [subscription] = await database`insert into billing.tenant_subscriptions (id, tenant_id, billed_until, started_at, provider_subscription_reference)
		values (gen_random_uuid(), ${tenantId}, ${billedUntil}, ${new Date(billedUntil.getTime() - 30 * dayInMilliseconds)}, ${cardReference}) returning id`;
	subscriptionId = subscription?.id;
	await database`insert into billing.tenant_subscription_items (id, tenant_id, subscription_id, offer_version_id, billed_monthly_price_cents, started_at)
		values (gen_random_uuid(), ${tenantId}, ${subscriptionId}, ${version?.id}, 3000, ${new Date(billedUntil.getTime() - 30 * dayInMilliseconds)})`;
}

beforeAll(async () => {
	await cleanUp();
	await database`insert into pharmacy.tenants (id, name, street, postal_code, city, phone_number)
		values (${tenantId}, 'Pharmacie des événements', '1 rue de la Paix', '75002', 'Paris', '0123456789')`;
});

afterAll(async () => {
	await cleanUp();
	await database.end();
});

describe('les événements d’abonnement', () => {
	it('renouvelle : la période avance, l’abonnement reste actif, l’accès est refait', async () => {
		await database`delete from billing.tenant_subscriptions where tenant_id = ${tenantId}`;
		await createSubscription('test_card');

		expect(await renewSubscription(subscriptionId, tenantId, now)).toBe('renewed');

		const [subscription] = await database`select status, billed_until from billing.tenant_subscriptions where id = ${subscriptionId}`;
		expect(subscription?.status).toBe('active');
		expect(subscription?.billed_until.getTime()).toBeGreaterThan(now.getTime());
		const accessLines = await readToolAccessLines(tenantId);
		expect(accessLines.map((line) => line.toolKey)).toContain('planning');
	});

	it('un paiement raté passe l’abonnement en retard sans fermer l’accès, puis les relances l’arrêtent', async () => {
		await database`delete from billing.tenant_subscriptions where tenant_id = ${tenantId}`;
		await createSubscription(fakeDeclinedCardReference);

		expect(await renewSubscription(subscriptionId, tenantId, now)).toBe('payment-failed');
		const [pastDue] = await database`select status, failed_attempts, next_retry_at from billing.tenant_subscriptions where id = ${subscriptionId}`;
		expect(pastDue?.status).toBe('past_due');
		expect(pastDue?.failed_attempts).toBe(1);
		expect((await readToolAccessLines(tenantId)).map((line) => line.toolKey)).toContain('planning');

		const retryDay = (dayCount: number) => new Date(now.getTime() + dayCount * dayInMilliseconds + 1000);
		expect(await retryFailedPayment(subscriptionId, tenantId, retryDay(1))).toBe('payment-failed');
		expect(await retryFailedPayment(subscriptionId, tenantId, retryDay(4))).toBe('payment-failed');
		expect(await retryFailedPayment(subscriptionId, tenantId, retryDay(7))).toBe('abandoned');
		const [ended] = await database`select status from billing.tenant_subscriptions where id = ${subscriptionId}`;
		expect(ended?.status).toBe('ended');
	});

	it('une relance réussie réactive l’abonnement', async () => {
		await database`delete from billing.tenant_subscriptions where tenant_id = ${tenantId}`;
		await createSubscription(fakeDeclinedCardReference);
		await renewSubscription(subscriptionId, tenantId, now);
		await database`update billing.tenant_subscriptions set provider_subscription_reference = 'test_card' where id = ${subscriptionId}`;

		const retryAt = new Date(now.getTime() + dayInMilliseconds + 1000);
		expect(await retryFailedPayment(subscriptionId, tenantId, retryAt)).toBe('renewed');
		const [subscription] = await database`select status, failed_attempts from billing.tenant_subscriptions where id = ${subscriptionId}`;
		expect(subscription).toMatchObject({ status: 'active', failed_attempts: 0 });
	});

	it('une baisse de prix bascule la ligne au prochain renouvellement, une hausse ne touche personne', async () => {
		await database`delete from billing.tenant_subscriptions where tenant_id = ${tenantId}`;
		await createSubscription('test_card');

		await publishOfferVersion({ offerKey, label: 'Offre de test', monthlyPriceCents: 4000, toolKeys: ['planning'] }, now);
		const [afterRise] = await database`select next_offer_version_id from billing.tenant_subscription_items where subscription_id = ${subscriptionId}`;
		expect(afterRise?.next_offer_version_id).toBeNull();

		const published = await publishOfferVersion({ offerKey, label: 'Offre de test', monthlyPriceCents: 2000, toolKeys: ['planning'] }, now);
		expect(published.switchedTenantIds).toEqual([tenantId]);
		await renewSubscription(subscriptionId, tenantId, now);
		const [item] = await database`select billed_monthly_price_cents from billing.tenant_subscription_items where subscription_id = ${subscriptionId}`;
		expect(item?.billed_monthly_price_cents).toBe(2000);
	});

	it('un prix négocié plus bas est facturé, et on retombe au prix de la version quand il se termine', async () => {
		await database`delete from billing.tenant_subscriptions where tenant_id = ${tenantId}`;
		await createSubscription('test_card');

		const priceAgreementId = await grantPriceAgreement({ beneficiary: { tenantId }, offerKey, monthlyPriceCents: 1500 }, now);
		const [withAgreement] = await database`select billed_monthly_price_cents from billing.tenant_subscription_items where subscription_id = ${subscriptionId}`;
		expect(withAgreement?.billed_monthly_price_cents).toBe(1500);

		await endPriceAgreement(priceAgreementId, now, now);
		const [withoutAgreement] = await database`select billed_monthly_price_cents from billing.tenant_subscription_items where subscription_id = ${subscriptionId}`;
		expect(withoutAgreement?.billed_monthly_price_cents).toBeGreaterThan(1500);
	});

	it('la vérification de cohérence répare une projection effacée', async () => {
		await database`delete from billing.tenant_subscriptions where tenant_id = ${tenantId}`;
		await createSubscription('test_card');
		await renewSubscription(subscriptionId, tenantId, now);
		await database`delete from billing.tenant_tool_access where tenant_id = ${tenantId}`;

		const reconciliation = await reconcileToolAccessOfTenant(tenantId, now);

		expect(reconciliation.differences.length).toBeGreaterThan(0);
		expect((await readToolAccessLines(tenantId)).map((line) => line.toolKey)).toContain('planning');
	});
});

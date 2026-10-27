import { describe, expect, it } from 'vitest';
import { computeBilledPriceCents, isPriceAgreementInForce, pickLowestAgreementPriceCents } from './negotiatedPrice';

describe('computeBilledPriceCents', () => {
	it('charges the version price without an agreement', () => {
		expect(computeBilledPriceCents({ offerVersionPriceCents: 2900, priceAgreementPriceCents: undefined })).toBe(2900);
	});

	it('caps the price at the negotiated price', () => {
		expect(computeBilledPriceCents({ offerVersionPriceCents: 2900, priceAgreementPriceCents: 2000 })).toBe(2000);
	});

	it('never raises the price above the version price', () => {
		expect(computeBilledPriceCents({ offerVersionPriceCents: 1500, priceAgreementPriceCents: 2000 })).toBe(1500);
	});

	it('follows a price drop below the agreement', () => {
		expect(computeBilledPriceCents({ offerVersionPriceCents: 1200, priceAgreementPriceCents: 2000 })).toBe(1200);
	});

	it('accepts a free negotiated price', () => {
		expect(computeBilledPriceCents({ offerVersionPriceCents: 2900, priceAgreementPriceCents: 0 })).toBe(0);
	});
});

describe('isPriceAgreementInForce', () => {
	const now = new Date('2026-06-15T10:00:00Z');

	it('is in force for life without an end date', () => {
		expect(isPriceAgreementInForce({ startsAt: new Date('2025-01-01'), endsAt: undefined }, now)).toBe(true);
	});

	it('is not in force before it starts or after it ends', () => {
		expect(isPriceAgreementInForce({ startsAt: new Date('2026-07-01'), endsAt: undefined }, now)).toBe(false);
		expect(isPriceAgreementInForce({ startsAt: new Date('2025-01-01'), endsAt: new Date('2026-06-15T10:00:00Z') }, now)).toBe(false);
	});
});

describe('pickLowestAgreementPriceCents', () => {
	it('takes the lowest of the tenant and group agreements', () => {
		expect(pickLowestAgreementPriceCents([2500, 1800])).toBe(1800);
	});

	it('returns nothing without agreement', () => {
		expect(pickLowestAgreementPriceCents([])).toBeUndefined();
	});
});

import { describe, expect, it } from 'vitest';
import { computeGroupMonthlyCharge } from './groupCharge';

describe('computeGroupMonthlyCharge', () => {
	it('à l’usage : la somme de ce que coûtent ses pharmacies', () => {
		const charge = computeGroupMonthlyCharge({
			billingMode: 'usage',
			flatRateMonthlyPriceCents: 200_000,
			pharmacyQuota: 200,
			memberPharmacyCount: 3,
			usageMonthlyCostCents: 14_400
		});

		expect(charge.monthlyTotalCents).toBe(14_400);
	});

	it('au forfait : le même prix, quel que soit le nombre de membres sous le quota', () => {
		const charge = computeGroupMonthlyCharge({
			billingMode: 'flat_rate',
			flatRateMonthlyPriceCents: 200_000,
			pharmacyQuota: 200,
			memberPharmacyCount: 0,
			usageMonthlyCostCents: 0
		});

		expect(charge.monthlyTotalCents).toBe(200_000);
	});

	it('au-delà du quota : chaque pharmacie en plus coûte forfait ÷ quota', () => {
		const charge = computeGroupMonthlyCharge({
			billingMode: 'flat_rate',
			flatRateMonthlyPriceCents: 200_000,
			pharmacyQuota: 200,
			memberPharmacyCount: 205,
			usageMonthlyCostCents: 0
		});

		expect(charge).toMatchObject({ overagePharmacyCount: 5, overageUnitPriceCents: 1000, monthlyTotalCents: 205_000 });
	});
});

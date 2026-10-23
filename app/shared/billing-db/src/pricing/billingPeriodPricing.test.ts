import { describe, expect, it } from 'vitest';
import { computePeriodEnd, computePeriodStart } from '../subscriptions/subscriptionPeriod';
import { monthlyEquivalentOfYearlyPrice, priceForPeriod, spreadLinesOverPeriod } from './billingPeriodPricing';

describe('priceForPeriod', () => {
	it('fait payer dix mois pour un an quand deux mois sont offerts', () => {
		expect(priceForPeriod(2900, 'yearly', 2)).toBe(29000);
		expect(priceForPeriod(2900, 'monthly', 2)).toBe(2900);
	});

	it('donne le prix d’un mois payé à l’année', () => {
		expect(monthlyEquivalentOfYearlyPrice(2900, 2)).toBe(2417);
	});
});

describe('spreadLinesOverPeriod', () => {
	it('montre douze mois puis les mois offerts en déduction', () => {
		const lines = spreadLinesOverPeriod([{ label: 'Module Site internet', amountCents: 2900 }], 'yearly', 2);

		expect(lines).toEqual([
			{ label: 'Module Site internet · 12 mois', amountCents: 34800 },
			{ label: 'Paiement à l’année : 2 mois offerts', amountCents: -5800 }
		]);
		expect(lines.reduce((total, line) => total + line.amountCents, 0)).toBe(29000);
	});
});

describe('computePeriodEnd', () => {
	it('finit un an plus tard pour une période annuelle, et revient au début', () => {
		const periodEnd = computePeriodEnd(new Date(2026, 9, 23), 'yearly');

		expect(periodEnd).toEqual(new Date(2027, 9, 23));
		expect(computePeriodStart(periodEnd, 'yearly')).toEqual(new Date(2026, 9, 23));
	});
});

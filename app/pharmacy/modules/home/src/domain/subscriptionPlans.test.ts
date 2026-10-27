import type { ToolCatalog } from '@crystal-pharm/billing-db/domain';
import { describe, expect, it } from 'vitest';
import { buildSubscriptionPlans, findPlanOfToolKeys } from './subscriptionPlans';

const catalog: ToolCatalog = {
	toolPrices: [
		{ toolKey: 'planning', monthlyPriceCents: 999 },
		{ toolKey: 'site', monthlyPriceCents: 2499 }
	],
	packMonthlyPriceCents: 2999,
	annualFreeMonths: 2
};

describe('buildSubscriptionPlans', () => {
	it('propose trois formules, le pack avantageux au milieu', () => {
		const plans = buildSubscriptionPlans(catalog, []);

		expect(plans.map((plan) => plan.planKey)).toEqual(['planning', 'pack', 'site']);
		expect(plans.map((plan) => plan.isFeatured)).toEqual([false, true, false]);
		expect(plans.map((plan) => plan.pharmacyMonthlyPriceCents)).toEqual([999, 2999, 2499]);
		expect(plans[1]?.listMonthlyPriceCents).toBe(3498);
	});

	it('n’a pas de formule du milieu sans pack', () => {
		const plans = buildSubscriptionPlans({ ...catalog, packMonthlyPriceCents: undefined }, []);

		expect(plans.map((plan) => plan.planKey)).toEqual(['planning', 'site']);
	});

	it('grise la formule que le groupement offre déjà et retire le pack', () => {
		const plans = buildSubscriptionPlans(catalog, [{ toolKey: 'site', discountPercent: 0, groupSharePercent: 100 }]);

		expect(plans.map((plan) => plan.planKey)).toEqual(['planning', 'site']);
		expect(plans.find((plan) => plan.planKey === 'site')?.isAlreadyIncluded).toBe(true);
		expect(plans.find((plan) => plan.planKey === 'planning')?.isAlreadyIncluded).toBe(false);
	});

	it('met la réduction du groupement sur la formule concernée', () => {
		const plans = buildSubscriptionPlans(catalog, [{ toolKey: 'planning', discountPercent: 20, groupSharePercent: 0 }]);
		const planningPlan = plans.find((plan) => plan.planKey === 'planning');

		expect(planningPlan?.pharmacyMonthlyPriceCents).toBe(799);
		expect(planningPlan?.listMonthlyPriceCents).toBe(999);
		expect(planningPlan?.coverageSummary).toBeDefined();
	});
});

describe('findPlanOfToolKeys', () => {
	it('retrouve la formule d’un abonnement, quel que soit l’ordre', () => {
		const plans = buildSubscriptionPlans(catalog, []);

		expect(findPlanOfToolKeys(plans, ['site', 'planning'])?.planKey).toBe('pack');
		expect(findPlanOfToolKeys(plans, ['planning'])?.planKey).toBe('planning');
		expect(findPlanOfToolKeys(plans, [])).toBeUndefined();
	});
});

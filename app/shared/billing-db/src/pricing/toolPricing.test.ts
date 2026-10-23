import { describe, expect, it } from 'vitest';
import { quoteTools, type ToolCatalog, type ToolCoverage } from './toolPricing';

const catalog: ToolCatalog = {
	toolPrices: [
		{ toolKey: 'site', monthlyPriceCents: 2900 },
		{ toolKey: 'booking', monthlyPriceCents: 3900 },
		{ toolKey: 'prescriptions', monthlyPriceCents: 2900 },
		{ toolKey: 'planning', monthlyPriceCents: 1900 }
	],
	packMonthlyPriceCents: undefined
};

const quoteOf = (toolKey: string, quote: ReturnType<typeof quoteTools>) =>
	quote.toolQuotes.find((toolQuote) => toolQuote.toolKey === toolKey);

describe('quoteTools', () => {
	it('n’active rien pour une pharmacie seule qui n’a rien choisi', () => {
		const quote = quoteTools({ catalog, coverages: [], selectedToolKeys: [] });

		expect(quote.toolQuotes.every((toolQuote) => !toolQuote.isActive)).toBe(true);
		expect(quote.pharmacyMonthlyTotalCents).toBe(0);
	});

	it('fait payer le prix catalogue des Tools choisis', () => {
		const quote = quoteTools({ catalog, coverages: [], selectedToolKeys: ['site', 'planning'] });

		expect(quote.pharmacyMonthlyTotalCents).toBe(4800);
		expect(quote.groupMonthlyTotalCents).toBe(0);
	});

	it('active sans abonnement un Tool payé par le groupement', () => {
		const coverages: ToolCoverage[] = [{ toolKey: 'site', discountPercent: 0, groupSharePercent: 100 }];
		const quote = quoteTools({ catalog, coverages, selectedToolKeys: [] });

		expect(quoteOf('site', quote)).toMatchObject({ isIncluded: true, isActive: true, pharmacyPriceCents: 0, coverageKind: 'full' });
		expect(quote.groupMonthlyTotalCents).toBe(2900);
	});

	it('applique la remise négociée aussi à ce que paie le groupement', () => {
		const coverages: ToolCoverage[] = [{ toolKey: 'site', discountPercent: 20, groupSharePercent: 100 }];
		const quote = quoteTools({ catalog, coverages, selectedToolKeys: [] });

		expect(quoteOf('site', quote)?.groupPriceCents).toBe(2320);
	});

	it('remise seule : la pharmacie paie le prix remisé, si elle s’abonne', () => {
		const coverages: ToolCoverage[] = [{ toolKey: 'booking', discountPercent: 20, groupSharePercent: 0 }];

		expect(quoteOf('booking', quoteTools({ catalog, coverages, selectedToolKeys: [] }))).toMatchObject({
			isActive: false,
			pharmacyPriceCents: 3120,
			coverageKind: 'discount'
		});
		expect(quoteTools({ catalog, coverages, selectedToolKeys: ['booking'] }).pharmacyMonthlyTotalCents).toBe(3120);
	});

	it('coût partagé : chacun paie sa part, seulement si la pharmacie s’abonne', () => {
		const coverages: ToolCoverage[] = [{ toolKey: 'planning', discountPercent: 0, groupSharePercent: 50 }];

		expect(quoteTools({ catalog, coverages, selectedToolKeys: [] }).groupMonthlyTotalCents).toBe(0);
		const subscribedQuote = quoteTools({ catalog, coverages, selectedToolKeys: ['planning'] });
		expect(subscribedQuote.pharmacyMonthlyTotalCents).toBe(950);
		expect(subscribedQuote.groupMonthlyTotalCents).toBe(950);
	});

	it('remplace la somme par le prix du pack quand tous les Tools payants sont actifs', () => {
		const catalogWithPack: ToolCatalog = { ...catalog, packMonthlyPriceCents: 9900 };

		const everyToolQuote = quoteTools({
			catalog: catalogWithPack,
			coverages: [],
			selectedToolKeys: ['site', 'booking', 'prescriptions', 'planning']
		});
		expect(everyToolQuote.isPackApplied).toBe(true);
		expect(everyToolQuote.pharmacyMonthlyTotalCents).toBe(9900);
		expect(everyToolQuote.listMonthlyTotalCents).toBe(11600);

		const threeToolQuote = quoteTools({ catalog: catalogWithPack, coverages: [], selectedToolKeys: ['site', 'booking', 'planning'] });
		expect(threeToolQuote.isPackApplied).toBe(false);
	});

	it('compte un Tool payé par le groupement pour atteindre le pack', () => {
		const catalogWithPack: ToolCatalog = { ...catalog, packMonthlyPriceCents: 9900 };
		const coverages: ToolCoverage[] = [{ toolKey: 'site', discountPercent: 0, groupSharePercent: 100 }];

		const quote = quoteTools({
			catalog: catalogWithPack,
			coverages,
			selectedToolKeys: ['booking', 'prescriptions', 'planning']
		});

		expect(quote.isPackApplied).toBe(true);
		expect(quote.pharmacyMonthlyTotalCents + quote.groupMonthlyTotalCents).toBe(9900);
	});

	it('rend gratuit pour tous un Tool à 0 €, et ignore un Tool hors catalogue', () => {
		const quote = quoteTools({
			catalog: { toolPrices: [{ toolKey: 'site', monthlyPriceCents: 0 }], packMonthlyPriceCents: undefined },
			coverages: [],
			selectedToolKeys: ['booking']
		});

		expect(quote.toolQuotes.map((toolQuote) => [toolQuote.toolKey, toolQuote.isActive])).toEqual([['site', true]]);
	});
});

import { describe, expect, it } from 'vitest';
import { quoteTools, type ToolCatalog, type ToolCoverage } from './toolPricing';

const catalog: ToolCatalog = {
	toolPrices: [
		{ toolKey: 'site', monthlyPriceCents: 2900 },
		{ toolKey: 'planning', monthlyPriceCents: 1900 }
	],
	packMonthlyPriceCents: undefined,
	annualFreeMonths: 2
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

	it('donne Rendez-vous et Ordonnances avec le site, sans rien coûter de plus', () => {
		const quote = quoteTools({ catalog, coverages: [], selectedToolKeys: ['site'] });

		expect(quoteOf('booking', quote)).toMatchObject({ isActive: true, isIncludedWithAnotherTool: true, pharmacyPriceCents: 0 });
		expect(quoteOf('prescriptions', quote)?.isActive).toBe(true);
		expect(quote.pharmacyMonthlyTotalCents).toBe(2900);
	});

	it('donne aussi Rendez-vous et Ordonnances avec le planning seul', () => {
		const quote = quoteTools({ catalog, coverages: [], selectedToolKeys: ['planning'] });

		expect(quoteOf('booking', quote)?.isActive).toBe(true);
	});

	it('ne vend jamais seuls Rendez-vous et Ordonnances, même choisis ou avec un prix', () => {
		const catalogWithOldPrice: ToolCatalog = { ...catalog, toolPrices: [...catalog.toolPrices, { toolKey: 'booking', monthlyPriceCents: 3900 }] };
		const quote = quoteTools({ catalog: catalogWithOldPrice, coverages: [], selectedToolKeys: ['booking'] });

		expect(quoteOf('booking', quote)).toMatchObject({ isActive: false, pharmacyPriceCents: 0 });
		expect(quote.pharmacyMonthlyTotalCents).toBe(0);
	});

	it('active sans abonnement un Tool payé par le groupement, et ce qu’il donne', () => {
		const coverages: ToolCoverage[] = [{ toolKey: 'site', discountPercent: 0, groupSharePercent: 100 }];
		const quote = quoteTools({ catalog, coverages, selectedToolKeys: [] });

		expect(quoteOf('site', quote)).toMatchObject({ isIncluded: true, isActive: true, pharmacyPriceCents: 0, coverageKind: 'full' });
		expect(quoteOf('booking', quote)?.isActive).toBe(true);
		expect(quote.groupMonthlyTotalCents).toBe(2900);
	});

	it('applique la remise négociée aussi à ce que paie le groupement', () => {
		const coverages: ToolCoverage[] = [{ toolKey: 'site', discountPercent: 20, groupSharePercent: 100 }];
		const quote = quoteTools({ catalog, coverages, selectedToolKeys: [] });

		expect(quoteOf('site', quote)?.groupPriceCents).toBe(2320);
	});

	it('remise seule : la pharmacie paie le prix remisé, si elle s’abonne', () => {
		const coverages: ToolCoverage[] = [{ toolKey: 'site', discountPercent: 20, groupSharePercent: 0 }];

		expect(quoteOf('site', quoteTools({ catalog, coverages, selectedToolKeys: [] }))).toMatchObject({
			isActive: false,
			pharmacyPriceCents: 2320,
			coverageKind: 'discount'
		});
		expect(quoteTools({ catalog, coverages, selectedToolKeys: ['site'] }).pharmacyMonthlyTotalCents).toBe(2320);
	});

	it('coût partagé : chacun paie sa part, seulement si la pharmacie s’abonne', () => {
		const coverages: ToolCoverage[] = [{ toolKey: 'planning', discountPercent: 0, groupSharePercent: 50 }];

		expect(quoteTools({ catalog, coverages, selectedToolKeys: [] }).groupMonthlyTotalCents).toBe(0);
		const subscribedQuote = quoteTools({ catalog, coverages, selectedToolKeys: ['planning'] });
		expect(subscribedQuote.pharmacyMonthlyTotalCents).toBe(950);
		expect(subscribedQuote.groupMonthlyTotalCents).toBe(950);
	});

	it('remplace la somme par le prix du pack quand tous les Tools payants sont actifs', () => {
		const catalogWithPack: ToolCatalog = { ...catalog, packMonthlyPriceCents: 3900 };

		const everyToolQuote = quoteTools({ catalog: catalogWithPack, coverages: [], selectedToolKeys: ['site', 'planning'] });
		expect(everyToolQuote.isPackApplied).toBe(true);
		expect(everyToolQuote.pharmacyMonthlyTotalCents).toBe(3900);
		expect(everyToolQuote.listMonthlyTotalCents).toBe(4800);

		expect(quoteTools({ catalog: catalogWithPack, coverages: [], selectedToolKeys: ['site'] }).isPackApplied).toBe(false);
	});

	it('garde les prix catalogue avec un groupement : le pack est l’offre des pharmacies seules', () => {
		const catalogWithPack: ToolCatalog = { ...catalog, packMonthlyPriceCents: 3900 };
		const coverages: ToolCoverage[] = [
			{ toolKey: 'site', discountPercent: 0, groupSharePercent: 100 },
			{ toolKey: 'planning', discountPercent: 20, groupSharePercent: 0 }
		];

		const quote = quoteTools({ catalog: catalogWithPack, coverages, selectedToolKeys: ['planning'] });

		expect(quote.isPackApplied).toBe(false);
		expect(quote.groupMonthlyTotalCents).toBe(2900);
		expect(quote.pharmacyMonthlyTotalCents).toBe(1520);
	});

	it('rend gratuit pour tous un Tool à 0 €, et ignore un Tool hors catalogue', () => {
		const quote = quoteTools({
			catalog: { toolPrices: [{ toolKey: 'site', monthlyPriceCents: 0 }], packMonthlyPriceCents: undefined, annualFreeMonths: 2 },
			coverages: [],
			selectedToolKeys: ['planning']
		});

		expect(quote.toolQuotes.filter((toolQuote) => toolQuote.isActive).map((toolQuote) => toolQuote.toolKey)).toEqual([
			'site',
			'booking',
			'prescriptions'
		]);
		expect(quoteOf('planning', quote)).toBeUndefined();
	});
});

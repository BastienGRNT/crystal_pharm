import { findIncludingToolKeys, isIncludedTool, toolKeys, type ToolKey } from '../tools/tools';

/** Un Tool en vente et son prix catalogue. Un Tool absent du catalogue n'est pas en vente. */
export type ToolPrice = { toolKey: ToolKey; monthlyPriceCents: number };

export type ToolCatalog = {
	toolPrices: readonly ToolPrice[];
	/** Le prix de tous les Tools payants pris ensemble ; `undefined` s'il n'y a pas de pack. */
	packMonthlyPriceCents: number | undefined;
	/** Payé à l'année : le nombre de mois offerts. */
	annualFreeMonths: number;
};

/** Ce qu'un GroupContract prévoit pour un Tool : une remise, puis la part payée par le groupement. */
export type ToolCoverage = { toolKey: ToolKey; discountPercent: number; groupSharePercent: number };

/** `full` : payé par le groupement · `shared` : partagé · `discount` : remise seule. */
export type CoverageKind = 'none' | 'discount' | 'shared' | 'full';

export type ToolQuote = {
	toolKey: ToolKey;
	listPriceCents: number;
	/** Ce que la pharmacie paie chaque mois pour ce Tool (pack, remise et part du groupement déduits). */
	pharmacyPriceCents: number;
	/** Ce que le groupement paie chaque mois pour ce Tool, s'il est actif. */
	groupPriceCents: number;
	coverageKind: CoverageKind;
	/** Accessible sans abonnement : gratuit, ou entièrement payé par le groupement. */
	isIncluded: boolean;
	/** Jamais vendu seul : compris dès qu'un des Tools qui le donnent est actif. */
	isIncludedWithAnotherTool: boolean;
	isActive: boolean;
};

export type ToolsQuote = {
	toolQuotes: ToolQuote[];
	pharmacyMonthlyTotalCents: number;
	groupMonthlyTotalCents: number;
	/** Le prix catalogue des Tools actifs : ce que paierait une pharmacie seule, sans pack. */
	listMonthlyTotalCents: number;
	isPackApplied: boolean;
};

export type ToolsQuoteRequest = {
	catalog: ToolCatalog;
	/** Le contrat du groupement qui prend en charge la pharmacie ; vide sans groupement. */
	coverages: readonly ToolCoverage[];
	/** Les Tools auxquels la pharmacie est abonnée, ou qu'elle est en train de choisir. */
	selectedToolKeys: readonly ToolKey[];
};

const hundredPercent = 100;

/**
 * La seule règle de prix, utilisée par le serveur et par l'aperçu du navigateur :
 * part de la pharmacie = prix × (1 − remise) × (1 − part du groupement).
 * Quand tous les Tools payants sont actifs, le pack remplace la somme de leurs
 * prix, réparti au prorata : la remise et la part du groupement s'y appliquent.
 */
export function quoteTools({ catalog, coverages, selectedToolKeys }: ToolsQuoteRequest): ToolsQuote {
	const toolPricesOnSale = sortInToolOrder(catalog.toolPrices.filter((toolPrice) => !isIncludedTool(toolPrice.toolKey)));
	const activeToolKeys = toolPricesOnSale
		.filter(
			(toolPrice) =>
				isIncludedWithoutSubscription(toolPrice, findCoverage(coverages, toolPrice.toolKey)) ||
				selectedToolKeys.includes(toolPrice.toolKey)
		)
		.map((toolPrice) => toolPrice.toolKey);
	const packAdjustedPrices = applyPackWhenEveryPaidToolIsActive(toolPricesOnSale, activeToolKeys, catalog.packMonthlyPriceCents);

	const toolQuotes = toolPricesOnSale.map((toolPrice): ToolQuote => {
		const coverage = findCoverage(coverages, toolPrice.toolKey);
		const basePriceCents = packAdjustedPrices.pricesByToolKey.get(toolPrice.toolKey) ?? toolPrice.monthlyPriceCents;
		const { pharmacyPriceCents, groupPriceCents } = splitPrice(basePriceCents, coverage);
		return {
			toolKey: toolPrice.toolKey,
			listPriceCents: toolPrice.monthlyPriceCents,
			pharmacyPriceCents,
			groupPriceCents,
			coverageKind: describeCoverage(coverage),
			isIncluded: isIncludedWithoutSubscription(toolPrice, coverage),
			isIncludedWithAnotherTool: false,
			isActive: activeToolKeys.includes(toolPrice.toolKey)
		};
	});
	const sellableToolKeysOnSale = toolPricesOnSale.map((toolPrice) => toolPrice.toolKey);
	const includedToolQuotes = toolKeys
		.filter((toolKey) => findIncludingToolKeys(toolKey).some((includingToolKey) => sellableToolKeysOnSale.includes(includingToolKey)))
		.map((toolKey): ToolQuote => ({
			toolKey,
			listPriceCents: 0,
			pharmacyPriceCents: 0,
			groupPriceCents: 0,
			coverageKind: 'none',
			isIncluded: false,
			isIncludedWithAnotherTool: true,
			isActive: findIncludingToolKeys(toolKey).some((includingToolKey) => activeToolKeys.includes(includingToolKey))
		}));
	toolQuotes.push(...includedToolQuotes);
	toolQuotes.sort((first, second) => toolKeys.indexOf(first.toolKey) - toolKeys.indexOf(second.toolKey));

	const activeToolQuotes = toolQuotes.filter((toolQuote) => toolQuote.isActive);
	return {
		toolQuotes,
		pharmacyMonthlyTotalCents: sum(activeToolQuotes.map((toolQuote) => toolQuote.pharmacyPriceCents)),
		groupMonthlyTotalCents: sum(activeToolQuotes.map((toolQuote) => toolQuote.groupPriceCents)),
		listMonthlyTotalCents: sum(activeToolQuotes.map((toolQuote) => toolQuote.listPriceCents)),
		isPackApplied: packAdjustedPrices.isPackApplied
	};
}

/** Les Tools payants : ceux qu'il faut tous prendre pour avoir le pack. */
export function listPaidToolKeys(catalog: ToolCatalog): ToolKey[] {
	return sortInToolOrder(catalog.toolPrices.filter((toolPrice) => !isIncludedTool(toolPrice.toolKey)))
		.filter((toolPrice) => toolPrice.monthlyPriceCents > 0)
		.map((toolPrice) => toolPrice.toolKey);
}

export function describeCoverage(coverage: ToolCoverage | undefined): CoverageKind {
	if (!coverage) return 'none';
	if (coverage.groupSharePercent >= hundredPercent) return 'full';
	if (coverage.groupSharePercent > 0) return 'shared';
	if (coverage.discountPercent > 0) return 'discount';
	return 'none';
}

function isIncludedWithoutSubscription(toolPrice: ToolPrice, coverage: ToolCoverage | undefined): boolean {
	return splitPrice(toolPrice.monthlyPriceCents, coverage).pharmacyPriceCents === 0;
}

function splitPrice(
	basePriceCents: number,
	coverage: ToolCoverage | undefined
): { pharmacyPriceCents: number; groupPriceCents: number } {
	const discountPercent = coverage?.discountPercent ?? 0;
	const groupSharePercent = coverage?.groupSharePercent ?? 0;
	const discountedPriceCents = Math.round((basePriceCents * (hundredPercent - discountPercent)) / hundredPercent);
	const pharmacyPriceCents = Math.round((discountedPriceCents * (hundredPercent - groupSharePercent)) / hundredPercent);
	return { pharmacyPriceCents, groupPriceCents: discountedPriceCents - pharmacyPriceCents };
}

function applyPackWhenEveryPaidToolIsActive(
	toolPricesOnSale: readonly ToolPrice[],
	activeToolKeys: readonly ToolKey[],
	packMonthlyPriceCents: number | undefined
): { isPackApplied: boolean; pricesByToolKey: Map<ToolKey, number> } {
	const paidToolPrices = toolPricesOnSale.filter((toolPrice) => toolPrice.monthlyPriceCents > 0);
	const listTotalCents = sum(paidToolPrices.map((toolPrice) => toolPrice.monthlyPriceCents));
	const isPackApplied =
		packMonthlyPriceCents !== undefined &&
		paidToolPrices.length >= 2 &&
		packMonthlyPriceCents < listTotalCents &&
		paidToolPrices.every((toolPrice) => activeToolKeys.includes(toolPrice.toolKey));
	if (!isPackApplied) return { isPackApplied, pricesByToolKey: new Map() };

	// Au prorata, en centimes entiers : le reste de l'arrondi va au dernier Tool,
	// pour que la somme tombe exactement sur le prix du pack.
	const pricesByToolKey = new Map<ToolKey, number>();
	let allocatedCents = 0;
	paidToolPrices.forEach((toolPrice, toolIndex) => {
		const isLastPaidTool = toolIndex === paidToolPrices.length - 1;
		const allocatedPriceCents = isLastPaidTool
			? packMonthlyPriceCents - allocatedCents
			: Math.floor((packMonthlyPriceCents * toolPrice.monthlyPriceCents) / listTotalCents);
		pricesByToolKey.set(toolPrice.toolKey, allocatedPriceCents);
		allocatedCents += allocatedPriceCents;
	});
	return { isPackApplied, pricesByToolKey };
}

function findCoverage(coverages: readonly ToolCoverage[], toolKey: ToolKey): ToolCoverage | undefined {
	return coverages.find((coverage) => coverage.toolKey === toolKey);
}

function sortInToolOrder(toolPrices: readonly ToolPrice[]): ToolPrice[] {
	return toolPrices.toSorted((first, second) => toolKeys.indexOf(first.toolKey) - toolKeys.indexOf(second.toolKey));
}

function sum(amounts: readonly number[]): number {
	return amounts.reduce((total, amount) => total + amount, 0);
}

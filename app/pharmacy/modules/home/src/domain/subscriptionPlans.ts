import {
	findIncludedToolKeys,
	findTool,
	listPaidToolKeys,
	quoteTools,
	summarizeCoverage,
	type ToolCatalog,
	type ToolCoverage,
	type ToolKey
} from '@crystal-pharm/billing-db/domain';

export const packPlanKey = 'pack';

/** Une formule que la pharmacie peut choisir : un Tool seul, ou tous les Tools ensemble au prix du pack. */
export type SubscriptionPlan = {
	planKey: string;
	toolKeys: ToolKey[];
	title: string;
	description: string;
	/** La formule du milieu, la plus avantageuse : celle qu'on met en avant. */
	isFeatured: boolean;
	pharmacyMonthlyPriceCents: number;
	/** La somme des prix catalogue de ses Tools : ce que paierait une pharmacie sans pack ni groupement. */
	listMonthlyPriceCents: number;
	/** « Offert », « −20 % » : ce que le contrat du groupement prévoit pour son Tool (formule d'un seul Tool). */
	coverageSummary: string | undefined;
	/** Rien à payer : le groupement offre déjà tout ce que la formule contient. */
	isAlreadyIncluded: boolean;
	featureToolKeys: ToolKey[];
};

/**
 * Un Tool payant = une formule, et le pack (tous les Tools payants) au milieu
 * quand il est moins cher que la somme. Les moins chères à gauche, la plus
 * chère à droite. Avec une prise en charge, le pack n'existe plus (cf. `quoteTools`).
 */
export function buildSubscriptionPlans(catalog: ToolCatalog, coverages: readonly ToolCoverage[]): SubscriptionPlan[] {
	const singlePlans = listPaidToolKeys(catalog)
		.map((toolKey) => buildSinglePlan(catalog, coverages, toolKey))
		.toSorted((first, second) => first.listMonthlyPriceCents - second.listMonthlyPriceCents);
	const packPlan = buildPackPlan(catalog, coverages);
	if (!packPlan) return singlePlans;
	const middleIndex = Math.floor(singlePlans.length / 2);
	return [...singlePlans.slice(0, middleIndex), packPlan, ...singlePlans.slice(middleIndex)];
}

export function findPlanOfToolKeys(plans: readonly SubscriptionPlan[], toolKeys: readonly ToolKey[]): SubscriptionPlan | undefined {
	return plans.find((plan) => plan.toolKeys.length === toolKeys.length && plan.toolKeys.every((toolKey) => toolKeys.includes(toolKey)));
}

function buildSinglePlan(catalog: ToolCatalog, coverages: readonly ToolCoverage[], toolKey: ToolKey): SubscriptionPlan {
	const tool = findTool(toolKey);
	const quote = quoteTools({ catalog, coverages, selectedToolKeys: [toolKey] });
	const toolQuote = quote.toolQuotes.find((candidate) => candidate.toolKey === toolKey);
	return {
		planKey: toolKey,
		toolKeys: [toolKey],
		title: tool.label,
		description: tool.pitch,
		isFeatured: false,
		pharmacyMonthlyPriceCents: toolQuote?.pharmacyPriceCents ?? 0,
		listMonthlyPriceCents: toolQuote?.listPriceCents ?? 0,
		coverageSummary: summarizeCoverage(coverages.find((coverage) => coverage.toolKey === toolKey)),
		isAlreadyIncluded: toolQuote?.isIncluded ?? false,
		featureToolKeys: [toolKey]
	};
}

function buildPackPlan(catalog: ToolCatalog, coverages: readonly ToolCoverage[]): SubscriptionPlan | undefined {
	const paidToolKeys = listPaidToolKeys(catalog);
	const quote = quoteTools({ catalog, coverages, selectedToolKeys: paidToolKeys });
	if (!quote.isPackApplied) return undefined;
	return {
		planKey: packPlanKey,
		toolKeys: paidToolKeys,
		title: paidToolKeys.map((toolKey) => findTool(toolKey).label).join(' + '),
		description: 'Tous vos modules ensemble, au meilleur prix.',
		isFeatured: true,
		pharmacyMonthlyPriceCents: quote.pharmacyMonthlyTotalCents,
		listMonthlyPriceCents: quote.listMonthlyTotalCents,
		coverageSummary: undefined,
		isAlreadyIncluded: false,
		featureToolKeys: paidToolKeys
	};
}

/** Ce que la formule apporte : ses Tools, puis ce qui vient avec sans rien payer de plus. */
export function listPlanFeatures(plan: SubscriptionPlan): { title: string; description?: string }[] {
	return plan.featureToolKeys.flatMap((toolKey) => [
		{ title: findTool(toolKey).label, description: findTool(toolKey).pitch },
		...findIncludedToolKeys(toolKey).map((includedToolKey) => ({
			title: `${findTool(includedToolKey).label} en ligne`,
			description: findTool(includedToolKey).pitch
		}))
	]);
}

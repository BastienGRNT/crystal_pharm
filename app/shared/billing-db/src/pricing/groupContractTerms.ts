import type { BillingPeriod, GroupBillingMode, GroupPaymentMethod } from '../database/billingTables';
import { formatEuros } from '../money/euroAmount';
import { priceForPeriod } from './billingPeriodPricing';
import { computeOverageUnitPrice } from './groupCharge';
import { quoteTools, type ToolCatalog, type ToolCoverage } from './toolPricing';
import { findIncludingToolKeys, findTool, isIncludedTool, joinToolLabels, sellableToolKeys, toolKeys, type ToolKey } from '../tools/tools';

/** `group` : le groupement paie tout · `shared` : chacun sa part · `pharmacy` : la pharmacie paie (avec une remise, peut-être). */
export type ToolPayer = 'group' | 'shared' | 'pharmacy';

/** Ce que prévoit le contrat pour un module pris seul (sans le pack). */
export type ContractToolTerms = {
	toolKey: ToolKey;
	label: string;
	listPriceCents: number;
	pharmacyPriceCents: number;
	groupPriceCents: number;
	payer: ToolPayer;
	discountPercent: number;
	groupSharePercent: number;
};

export type GroupContractTerms = {
	toolTerms: ContractToolTerms[];
	/** Les modules compris avec un autre (Rendez-vous et Ordonnances, avec le site). */
	includedToolKeys: ToolKey[];
	/** Une pharmacie qui prend tout : le pack s'applique s'il existe. */
	everyToolForPharmacy: { listPriceCents: number; pharmacyPriceCents: number; groupPriceCents: number; isPackApplied: boolean };
	/**
	 * Une pharmacie membre qui prend tout paierait plus qu'une pharmacie seule
	 * avec le pack : à signaler à la Platform, qui ajustera la remise.
	 */
	isPackCheaperForPharmacy: boolean;
	groupPaysSomething: boolean;
};

export type GroupBillingTerms = {
	billingMode: GroupBillingMode;
	flatRateMonthlyPriceCents: number | undefined;
	pharmacyQuota: number;
	billingPeriod: BillingPeriod;
	paymentMethod: GroupPaymentMethod;
	annualFreeMonths: number;
};

/** À qui l'on parle : au groupement lui-même (« vous »), ou de lui (« Pharma+ »). */
export type ContractVoice = { groupName: string; isAddressedToGroup: boolean };

export type GroupContractWords = { forPharmacies: string[]; forGroup: string[] };

export function describeGroupContractTerms(catalog: ToolCatalog, coverages: readonly ToolCoverage[]): GroupContractTerms {
	const singleToolQuote = quoteTools({
		catalog: { ...catalog, packMonthlyPriceCents: undefined },
		coverages,
		selectedToolKeys: sellableToolKeys
	});
	const everyToolQuote = quoteTools({ catalog, coverages, selectedToolKeys: sellableToolKeys });
	const toolTerms = singleToolQuote.toolQuotes
		.filter((toolQuote) => !toolQuote.isIncludedWithAnotherTool)
		.map((toolQuote): ContractToolTerms => {
			const coverage = coverages.find((candidate) => candidate.toolKey === toolQuote.toolKey);
			const groupSharePercent = coverage?.groupSharePercent ?? 0;
			return {
				toolKey: toolQuote.toolKey,
				label: findTool(toolQuote.toolKey).label,
				listPriceCents: toolQuote.listPriceCents,
				pharmacyPriceCents: toolQuote.pharmacyPriceCents,
				groupPriceCents: toolQuote.groupPriceCents,
				payer: decideToolPayer(groupSharePercent),
				discountPercent: coverage?.discountPercent ?? 0,
				groupSharePercent
			};
		});
	return {
		toolTerms,
		includedToolKeys: toolKeys.filter(isIncludedTool),
		everyToolForPharmacy: {
			listPriceCents: everyToolQuote.listMonthlyTotalCents,
			pharmacyPriceCents: everyToolQuote.pharmacyMonthlyTotalCents,
			groupPriceCents: everyToolQuote.groupMonthlyTotalCents,
			isPackApplied: everyToolQuote.isPackApplied
		},
		isPackCheaperForPharmacy:
			catalog.packMonthlyPriceCents !== undefined && everyToolQuote.pharmacyMonthlyTotalCents > catalog.packMonthlyPriceCents,
		groupPaysSomething: toolTerms.some((terms) => terms.payer !== 'pharmacy')
	};
}

/**
 * Le contrat en phrases, les mêmes partout : ce qu'ont les pharmacies, puis ce
 * que paie le groupement, quand et comment.
 */
export function describeGroupContractInWords(
	terms: GroupContractTerms,
	billing: GroupBillingTerms,
	voice: ContractVoice
): GroupContractWords {
	return { forPharmacies: describeWhatPharmaciesGet(terms, voice), forGroup: describeWhatGroupPays(terms, billing, voice) };
}

function decideToolPayer(groupSharePercent: number): ToolPayer {
	if (groupSharePercent >= 100) return 'group';
	if (groupSharePercent > 0) return 'shared';
	return 'pharmacy';
}

function describeWhatPharmaciesGet(terms: GroupContractTerms, voice: ContractVoice): string[] {
	const words = conjugate(voice);
	const offeredTerms = terms.toolTerms.filter((toolTerms) => toolTerms.payer === 'group');
	const offeredToolKeys = offeredTerms.map((toolTerms) => toolTerms.toolKey);
	const includedLabels = terms.includedToolKeys
		.filter((toolKey) => findIncludingToolKeys(toolKey).some((includingToolKey) => offeredToolKeys.includes(includingToolKey)))
		.map((toolKey) => findTool(toolKey).label);
	const sentences: string[] = [];
	if (offeredTerms.length > 0) {
		sentences.push(
			`${words.subject} ${words.offer} à ${words.possessive} pharmacies : ${joinToolLabels(offeredTerms.map((toolTerms) => toolTerms.label))}` +
				(includedLabels.length > 0 ? `, avec ${joinToolLabels(includedLabels)} compris.` : '.')
		);
	}
	for (const toolTerms of terms.toolTerms.filter((candidate) => candidate.payer === 'shared')) {
		sentences.push(
			`${toolTerms.label} : ${words.subjectLowercase} ${words.pay} ${toolTerms.groupSharePercent} %, la pharmacie ${formatEuros(toolTerms.pharmacyPriceCents)} HT par mois.`
		);
	}
	for (const toolTerms of terms.toolTerms.filter((candidate) => candidate.payer === 'pharmacy' && candidate.discountPercent > 0)) {
		sentences.push(
			`${toolTerms.label} : −${toolTerms.discountPercent} % pour ${words.possessive} pharmacies, soit ${formatEuros(toolTerms.pharmacyPriceCents)} HT par mois au lieu de ${formatEuros(toolTerms.listPriceCents)}.`
		);
	}
	const fullPriceLabels = terms.toolTerms
		.filter((toolTerms) => toolTerms.payer === 'pharmacy' && toolTerms.discountPercent === 0)
		.map((toolTerms) => toolTerms.label);
	if (sentences.length === 0) {
		sentences.push(`${words.subject} ne ${words.take} rien en charge : ${words.possessive} pharmacies paient le prix normal.`);
	} else if (fullPriceLabels.length > 0) {
		sentences.push(`${joinToolLabels(fullPriceLabels)} : au prix normal, si la pharmacie le veut.`);
	}
	return sentences;
}

function describeWhatGroupPays(terms: GroupContractTerms, billing: GroupBillingTerms, voice: ContractVoice): string[] {
	const words = conjugate(voice);
	if (!terms.groupPaysSomething) return [`${words.subject} ne ${words.pay} rien à Crystal Pharm.`];

	const sentences: string[] = [];
	if (billing.billingMode === 'flat_rate') {
		const flatRateCents = billing.flatRateMonthlyPriceCents ?? 0;
		const unitPriceCents = computeOverageUnitPrice(flatRateCents, billing.pharmacyQuota);
		sentences.push(
			`${words.subject} ${words.pay} un forfait de ${formatEuros(flatRateCents)} HT par mois pour ${billing.pharmacyQuota} pharmacies, soit ${formatEuros(unitPriceCents)} par pharmacie, quel que soit leur usage.`,
			`Au-delà de ${billing.pharmacyQuota}, chaque pharmacie ajoute ${formatEuros(unitPriceCents)} HT par mois.`
		);
	} else {
		sentences.push(
			`${words.subject} ${words.pay} pour chaque pharmacie membre ce qu’elle utilise : jusqu’à ${formatEuros(terms.everyToolForPharmacy.groupPriceCents)} HT par mois et par pharmacie.`
		);
	}
	sentences.push(describePaymentRhythm(billing));
	return sentences;
}

function describePaymentRhythm(billing: GroupBillingTerms): string {
	const paymentWording = billing.paymentMethod === 'card' ? 'prélevé sur sa carte' : 'par facture, à régler par virement';
	if (billing.billingPeriod === 'yearly' && billing.billingMode === 'flat_rate') {
		const yearlyPriceCents = priceForPeriod(billing.flatRateMonthlyPriceCents ?? 0, 'yearly', billing.annualFreeMonths);
		return `Une fois par an : ${formatEuros(yearlyPriceCents)} HT, ${billing.annualFreeMonths} mois offerts, ${paymentWording}.`;
	}
	return `Chaque mois, ${paymentWording}.`;
}

function conjugate(voice: ContractVoice) {
	return voice.isAddressedToGroup
		? { subject: 'Vous', subjectLowercase: 'vous', offer: 'offrez', pay: 'payez', take: 'prenez', possessive: 'vos' }
		: { subject: voice.groupName, subjectLowercase: voice.groupName, offer: 'offre', pay: 'paie', take: 'prend', possessive: 'ses' };
}

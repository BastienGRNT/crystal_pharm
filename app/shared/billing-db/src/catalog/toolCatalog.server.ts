import type { FieldErrors, SaveResult } from '@crystal-pharm/pharmacy-db/domain';
import { inArray } from 'drizzle-orm';
import { platformBillingAccess, runWithBillingAccess, type BillingTransaction } from '../database/billingDatabase.server';
import { catalogSettings, offers } from '../database/billingTables';
import { parseEurosToCents } from '../money/euroAmount';
import type { ToolCatalog, ToolPrice } from '../pricing/toolPricing';
import { publishOfferVersion, type OfferVersionPublication } from '../events/offerVersionPublication.server';
import { listOffersOnSale, packOfferKey, readLatestOfferVersion } from '../offers/offerCatalog.server';
import { findTool, isIncludedTool, isToolKey, sellableToolKeys, type ToolKey } from '../tools/tools';

export const packPriceFieldName = 'pack';
export const annualFreeMonthsFieldName = 'annualFreeMonths';

export type ToolCatalogFieldName = ToolKey | typeof packPriceFieldName | typeof annualFreeMonthsFieldName;

/**
 * Ce que la Platform saisit : un prix en euros par Tool vendu (vide : pas en
 * vente), le prix du pack, et les mois offerts quand on paie à l'année.
 */
export type ToolCatalogInput = {
	toolPriceInputs: Partial<Record<ToolKey, string>>;
	packPriceInput: string;
	annualFreeMonthsInput: string;
};

const defaultAnnualFreeMonths = 2;

export function getToolCatalog(): Promise<ToolCatalog> {
	return runWithBillingAccess({}, readToolCatalog);
}

export async function readToolCatalog(transaction: BillingTransaction): Promise<ToolCatalog> {
	const offersOnSale = await listOffersOnSale(transaction);
	const [settings] = await transaction.select().from(catalogSettings);
	const packOffer = offersOnSale.find((offerOnSale) => offerOnSale.offerKey === packOfferKey);
	return {
		toolPrices: offersOnSale.flatMap((offerOnSale): ToolPrice[] =>
			isToolKey(offerOnSale.offerKey) && !isIncludedTool(offerOnSale.offerKey)
				? [{ toolKey: offerOnSale.offerKey, monthlyPriceCents: offerOnSale.monthlyPriceCents }]
				: []
		),
		packMonthlyPriceCents: packOffer?.monthlyPriceCents,
		annualFreeMonths: settings?.annualFreeMonths ?? defaultAnnualFreeMonths
	};
}

export async function saveToolCatalog(catalogInput: ToolCatalogInput): Promise<SaveResult<ToolCatalogFieldName>> {
	const fieldErrors: FieldErrors<ToolCatalogFieldName> = {};
	const pricesOnSale: ToolPrice[] = [];
	for (const toolKey of sellableToolKeys) {
		const priceInput = catalogInput.toolPriceInputs[toolKey]?.trim() ?? '';
		if (priceInput === '') continue;
		const monthlyPriceCents = parseEurosToCents(priceInput);
		if (monthlyPriceCents === undefined) fieldErrors[toolKey] = 'Indiquez un montant en euros, par exemple 29 ou 29,90.';
		else pricesOnSale.push({ toolKey, monthlyPriceCents });
	}

	const packPriceInput = catalogInput.packPriceInput.trim();
	const packMonthlyPriceCents = packPriceInput === '' ? undefined : parseEurosToCents(packPriceInput);
	if (packPriceInput !== '' && packMonthlyPriceCents === undefined) {
		fieldErrors[packPriceFieldName] = 'Indiquez un montant en euros, ou laissez vide pour ne pas proposer de pack.';
	}
	const paidTotalCents = pricesOnSale.reduce((total, toolPrice) => total + toolPrice.monthlyPriceCents, 0);
	if (packMonthlyPriceCents !== undefined && packMonthlyPriceCents >= paidTotalCents) {
		fieldErrors[packPriceFieldName] = 'Le pack doit coûter moins cher que tous les modules pris un par un.';
	}
	const annualFreeMonths = Number(catalogInput.annualFreeMonthsInput.trim() || defaultAnnualFreeMonths);
	if (!Number.isInteger(annualFreeMonths) || annualFreeMonths < 0 || annualFreeMonths > 11) {
		fieldErrors[annualFreeMonthsFieldName] = 'Indiquez un nombre de mois entre 0 et 11.';
	}
	if (Object.keys(fieldErrors).length > 0) return { isSaved: false, fieldErrors };

	await publishChangedOfferVersions(pricesOnSale, packMonthlyPriceCents);
	await runWithBillingAccess(platformBillingAccess, async (transaction) => {
		const offerKeysOnSale: string[] = pricesOnSale.map((toolPrice) => toolPrice.toolKey);
		if (packMonthlyPriceCents !== undefined) offerKeysOnSale.push(packOfferKey);
		await transaction.update(offers).set({ isOnSale: inArray(offers.offerKey, offerKeysOnSale) });
		await transaction
			.insert(catalogSettings)
			.values({ id: 1, annualFreeMonths })
			.onConflictDoUpdate({ target: catalogSettings.id, set: { annualFreeMonths } });
	});
	return { isSaved: true };
}

/** Un prix qui change = une nouvelle version de l'offre ; un prix inchangé n'en publie pas. */
async function publishChangedOfferVersions(pricesOnSale: readonly ToolPrice[], packMonthlyPriceCents: number | undefined): Promise<void> {
	const now = new Date();
	const offersToPublish: OfferVersionPublication[] = pricesOnSale.map((toolPrice) => {
		const tool: { label: string; offerLabel?: string } = findTool(toolPrice.toolKey);
		return {
			offerKey: toolPrice.toolKey,
			label: tool.offerLabel ?? tool.label,
			monthlyPriceCents: toolPrice.monthlyPriceCents,
			toolKeys: [toolPrice.toolKey]
		};
	});
	if (packMonthlyPriceCents !== undefined) {
		offersToPublish.push({ offerKey: packOfferKey, label: 'Tous les modules', monthlyPriceCents: packMonthlyPriceCents, toolKeys: [...sellableToolKeys] });
	}
	for (const offerToPublish of offersToPublish) {
		const latestOffer = await runWithBillingAccess({}, (transaction) => readLatestOfferVersion(transaction, offerToPublish.offerKey));
		if (latestOffer?.monthlyPriceCents === offerToPublish.monthlyPriceCents) continue;
		await publishOfferVersion(offerToPublish, now);
	}
}

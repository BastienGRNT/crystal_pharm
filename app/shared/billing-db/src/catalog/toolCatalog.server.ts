import type { FieldErrors, SaveResult } from '@crystal-pharm/pharmacy-db/domain';
import { notInArray } from 'drizzle-orm';
import { platformBillingAccess, runWithBillingAccess, type BillingTransaction } from '../database/billingDatabase.server';
import { catalogSettings, toolPrices } from '../database/billingTables';
import { parseEurosToCents } from '../money/euroAmount';
import type { ToolCatalog, ToolPrice } from '../pricing/toolPricing';
import { isToolKey, toolKeys, type ToolKey } from '../tools/tools';

export const packPriceFieldName = 'pack';

export type ToolCatalogFieldName = ToolKey | typeof packPriceFieldName;

/** Ce que la Platform saisit : un prix en euros par Tool (vide : pas en vente) et le prix du pack. */
export type ToolCatalogInput = {
	toolPriceInputs: Partial<Record<ToolKey, string>>;
	packPriceInput: string;
};

export function getToolCatalog(): Promise<ToolCatalog> {
	return runWithBillingAccess({}, readToolCatalog);
}

export async function readToolCatalog(transaction: BillingTransaction): Promise<ToolCatalog> {
	const priceRows = await transaction.select().from(toolPrices);
	const [settings] = await transaction.select().from(catalogSettings);
	return {
		toolPrices: priceRows
			.filter((priceRow) => isToolKey(priceRow.toolKey))
			.map((priceRow): ToolPrice => ({ toolKey: priceRow.toolKey, monthlyPriceCents: priceRow.monthlyPriceCents })),
		packMonthlyPriceCents: settings?.packMonthlyPriceCents ?? undefined
	};
}

export async function saveToolCatalog(catalogInput: ToolCatalogInput): Promise<SaveResult<ToolCatalogFieldName>> {
	const fieldErrors: FieldErrors<ToolCatalogFieldName> = {};
	const pricesOnSale: ToolPrice[] = [];
	for (const toolKey of toolKeys) {
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
	if (Object.keys(fieldErrors).length > 0) return { isSaved: false, fieldErrors };

	await runWithBillingAccess(platformBillingAccess, async (transaction) => {
		const toolKeysOnSale = pricesOnSale.map((toolPrice) => toolPrice.toolKey);
		await transaction
			.delete(toolPrices)
			.where(toolKeysOnSale.length > 0 ? notInArray(toolPrices.toolKey, toolKeysOnSale) : undefined);
		for (const toolPrice of pricesOnSale) {
			await transaction
				.insert(toolPrices)
				.values(toolPrice)
				.onConflictDoUpdate({ target: toolPrices.toolKey, set: { monthlyPriceCents: toolPrice.monthlyPriceCents } });
		}
		await transaction
			.insert(catalogSettings)
			.values({ id: 1, packMonthlyPriceCents: packMonthlyPriceCents ?? null })
			.onConflictDoUpdate({ target: catalogSettings.id, set: { packMonthlyPriceCents: packMonthlyPriceCents ?? null } });
	});
	return { isSaved: true };
}

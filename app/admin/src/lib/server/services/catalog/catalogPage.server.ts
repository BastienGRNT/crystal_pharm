import {
	annualFreeMonthsFieldName,
	getToolCatalog,
	listFlatRateOffers,
	packPriceFieldName,
	saveFlatRateOffers,
	saveToolCatalog,
	type FlatRateOfferInput,
	type ToolCatalogFieldName
} from '@crystal-pharm/billing-db';
import { formatCentsForInput, sellableToolKeys, type ToolCatalog, type ToolKey } from '@crystal-pharm/billing-db/domain';
import type { FieldErrors } from '@crystal-pharm/pharmacy-db/domain';
import { fail, type ActionFailure, type RequestEvent } from '@sveltejs/kit';

export type CatalogFormValues = { toolPriceInputs: Partial<Record<ToolKey, string>>; packPriceInput: string; annualFreeMonthsInput: string };

export type CatalogPageData = { catalog: ToolCatalog; values: CatalogFormValues; flatRateOfferInputs: FlatRateOfferInput[] };

export type CatalogActionResult =
	| { savedSection: 'prices' | 'flatRateOffers' }
	| { failedSection: 'prices'; values: CatalogFormValues; fieldErrors: FieldErrors<ToolCatalogFieldName> }
	| { failedSection: 'flatRateOffers'; flatRateOfferInputs: FlatRateOfferInput[]; failureMessage: string };

export async function loadCatalogPage(): Promise<CatalogPageData> {
	const [catalog, flatRateOffers] = await Promise.all([getToolCatalog(), listFlatRateOffers()]);
	return {
		catalog,
		values: {
			toolPriceInputs: Object.fromEntries(
				sellableToolKeys.map((toolKey) => [
					toolKey,
					formatCentsForInput(catalog.toolPrices.find((toolPrice) => toolPrice.toolKey === toolKey)?.monthlyPriceCents)
				])
			),
			packPriceInput: formatCentsForInput(catalog.packMonthlyPriceCents),
			annualFreeMonthsInput: String(catalog.annualFreeMonths)
		},
		flatRateOfferInputs: flatRateOffers.map((offer) => ({
			offerId: offer.offerId,
			label: offer.label,
			pharmacyQuotaInput: String(offer.pharmacyQuota),
			priceInput: formatCentsForInput(offer.monthlyPriceCents)
		}))
	};
}

export const catalogPageActions = {
	savePrices: async ({ request }: RequestEvent): Promise<CatalogActionResult | ActionFailure<CatalogActionResult>> => {
		const formData = await request.formData();
		const values: CatalogFormValues = {
			toolPriceInputs: Object.fromEntries(sellableToolKeys.map((toolKey) => [toolKey, String(formData.get(toolKey) ?? '')])),
			packPriceInput: String(formData.get(packPriceFieldName) ?? ''),
			annualFreeMonthsInput: String(formData.get(annualFreeMonthsFieldName) ?? '')
		};
		const catalogSave = await saveToolCatalog(values);
		if (!catalogSave.isSaved) return fail(400, { failedSection: 'prices', values, fieldErrors: catalogSave.fieldErrors });
		return { savedSection: 'prices' };
	},

	saveFlatRateOffers: async ({ request }: RequestEvent): Promise<CatalogActionResult | ActionFailure<CatalogActionResult>> => {
		const formData = await request.formData();
		const readColumn = (fieldName: string) => formData.getAll(fieldName).map(String);
		const labels = readColumn('offerLabel');
		const flatRateOfferInputs = labels.map((label, offerIndex) => ({
			offerId: readColumn('offerId')[offerIndex] ?? '',
			label,
			pharmacyQuotaInput: readColumn('offerQuota')[offerIndex] ?? '',
			priceInput: readColumn('offerPrice')[offerIndex] ?? ''
		}));
		const offersSave = await saveFlatRateOffers(flatRateOfferInputs);
		if (!offersSave.isSaved) {
			return fail(400, {
				failedSection: 'flatRateOffers',
				flatRateOfferInputs,
				failureMessage: Object.values(offersSave.fieldErrors)[0] ?? 'Ces offres n’ont pas pu être enregistrées.'
			});
		}
		return { savedSection: 'flatRateOffers' };
	}
};

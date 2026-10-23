import { getToolCatalog, packPriceFieldName, saveToolCatalog, type ToolCatalogFieldName } from '@crystal-pharm/billing-db';
import { formatCentsForInput, toolKeys, type ToolCatalog, type ToolKey } from '@crystal-pharm/billing-db/domain';
import type { FieldErrors } from '@crystal-pharm/pharmacy-db/domain';
import { fail, type ActionFailure, type RequestEvent } from '@sveltejs/kit';

export type CatalogFormValues = { toolPriceInputs: Record<ToolKey, string>; packPriceInput: string };

export type CatalogPageData = { catalog: ToolCatalog; values: CatalogFormValues };

export type CatalogSaveResult = { isSaved: true } | { isSaved: false; values: CatalogFormValues; fieldErrors: FieldErrors<ToolCatalogFieldName> };

export async function loadCatalogPage(): Promise<CatalogPageData> {
	const catalog = await getToolCatalog();
	return {
		catalog,
		values: {
			toolPriceInputs: Object.fromEntries(
				toolKeys.map((toolKey) => [
					toolKey,
					formatCentsForInput(catalog.toolPrices.find((toolPrice) => toolPrice.toolKey === toolKey)?.monthlyPriceCents)
				])
			) as Record<ToolKey, string>,
			packPriceInput: formatCentsForInput(catalog.packMonthlyPriceCents)
		}
	};
}

export const catalogPageActions = {
	default: async ({ request }: RequestEvent): Promise<CatalogSaveResult | ActionFailure<CatalogSaveResult>> => {
		const formData = await request.formData();
		const values: CatalogFormValues = {
			toolPriceInputs: Object.fromEntries(toolKeys.map((toolKey) => [toolKey, String(formData.get(toolKey) ?? '')])) as Record<
				ToolKey,
				string
			>,
			packPriceInput: String(formData.get(packPriceFieldName) ?? '')
		};
		const catalogSave = await saveToolCatalog(values);
		if (!catalogSave.isSaved) return fail(400, { isSaved: false, values, fieldErrors: catalogSave.fieldErrors });
		return { isSaved: true };
	}
};

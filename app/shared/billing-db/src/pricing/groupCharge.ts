import type { GroupBillingMode } from '../database/billingTables';

export type GroupChargeRequest = {
	billingMode: GroupBillingMode;
	/** Le forfait du contrat ; ignoré à l'usage. */
	flatRateMonthlyPriceCents: number | undefined;
	pharmacyQuota: number;
	memberPharmacyCount: number;
	/** Ce que coûtent les pharmacies membres, module par module (la règle de `quoteTools`). */
	usageMonthlyCostCents: number;
};

export type GroupCharge = {
	monthlyTotalCents: number;
	flatRateCents: number;
	/** Les pharmacies au-delà du quota d'un forfait, et ce que chacune coûte en plus. */
	overagePharmacyCount: number;
	overageUnitPriceCents: number;
	overageCents: number;
	usageCents: number;
};

/** Au-delà du quota d'un forfait, une pharmacie coûte ce qu'elle coûte dans le forfait : forfait ÷ quota. */
export function computeOverageUnitPrice(flatRateMonthlyPriceCents: number, pharmacyQuota: number): number {
	return pharmacyQuota > 0 ? Math.round(flatRateMonthlyPriceCents / pharmacyQuota) : 0;
}

/** Ce que le groupement paie chaque mois : la somme de ses pharmacies, ou son forfait et ses dépassements. */
export function computeGroupMonthlyCharge(request: GroupChargeRequest): GroupCharge {
	if (request.billingMode === 'usage') {
		return {
			monthlyTotalCents: request.usageMonthlyCostCents,
			flatRateCents: 0,
			overagePharmacyCount: 0,
			overageUnitPriceCents: 0,
			overageCents: 0,
			usageCents: request.usageMonthlyCostCents
		};
	}
	const flatRateCents = request.flatRateMonthlyPriceCents ?? 0;
	const overagePharmacyCount = Math.max(0, request.memberPharmacyCount - request.pharmacyQuota);
	const overageUnitPriceCents = computeOverageUnitPrice(flatRateCents, request.pharmacyQuota);
	const overageCents = overagePharmacyCount * overageUnitPriceCents;
	return {
		monthlyTotalCents: flatRateCents + overageCents,
		flatRateCents,
		overagePharmacyCount,
		overageUnitPriceCents,
		overageCents,
		usageCents: 0
	};
}

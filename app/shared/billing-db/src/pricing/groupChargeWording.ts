import type { GroupBillingMode } from '../database/billingTables';
import { formatEuros } from '../money/euroAmount';
import { computeOverageUnitPrice } from './groupCharge';

export type GroupBillingToDescribe = {
	billingMode: GroupBillingMode;
	flatRateMonthlyPriceCents: number | undefined;
	pharmacyQuota: number;
};

/** « Forfait de 150 € HT par mois pour 10 pharmacies », ou « À l'usage ». */
export function describeGroupBillingMode(groupBilling: GroupBillingToDescribe): string {
	if (groupBilling.billingMode === 'usage') return 'À l’usage, selon les modules actifs de ses pharmacies';
	return `Forfait de ${formatEuros(groupBilling.flatRateMonthlyPriceCents ?? 0)} HT par mois pour ${groupBilling.pharmacyQuota} pharmacies`;
}

/** « 15 € HT par mois pour chaque pharmacie au-delà de 10 » ; rien à l'usage. */
export function describeOveragePrice(groupBilling: GroupBillingToDescribe): string | undefined {
	if (groupBilling.billingMode === 'usage') return undefined;
	const overageUnitPriceCents = computeOverageUnitPrice(groupBilling.flatRateMonthlyPriceCents ?? 0, groupBilling.pharmacyQuota);
	return `${formatEuros(overageUnitPriceCents)} HT par mois pour chaque pharmacie au-delà de ${groupBilling.pharmacyQuota}`;
}

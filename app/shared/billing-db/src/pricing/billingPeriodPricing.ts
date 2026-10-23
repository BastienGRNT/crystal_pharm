import type { BillingPeriod, InvoiceLine } from '../database/billingTables';
import { monthsInBillingPeriod } from '../subscriptions/subscriptionPeriod';

/** Ce que coûte une période : un mois, ou douze mois moins les mois offerts. */
export function priceForPeriod(monthlyPriceCents: number, billingPeriod: BillingPeriod, annualFreeMonths: number): number {
	return monthlyPriceCents * countBilledMonths(billingPeriod, annualFreeMonths);
}

export function countBilledMonths(billingPeriod: BillingPeriod, annualFreeMonths: number): number {
	return billingPeriod === 'yearly' ? monthsInBillingPeriod.yearly - annualFreeMonths : 1;
}

/** Le prix d'un mois quand on paie à l'année : « soit 24,17 € par mois ». */
export function monthlyEquivalentOfYearlyPrice(monthlyPriceCents: number, annualFreeMonths: number): number {
	return Math.round(priceForPeriod(monthlyPriceCents, 'yearly', annualFreeMonths) / monthsInBillingPeriod.yearly);
}

/**
 * Les lignes d'une facture pour une période : chaque ligne mensuelle sur douze
 * mois, puis les mois offerts en déduction, pour que le cadeau se voie.
 */
export function spreadLinesOverPeriod(
	monthlyLines: readonly InvoiceLine[],
	billingPeriod: BillingPeriod,
	annualFreeMonths: number
): InvoiceLine[] {
	if (billingPeriod === 'monthly') return [...monthlyLines];
	const yearlyLines = monthlyLines.map((line) => ({
		label: `${line.label} · 12 mois`,
		amountCents: line.amountCents * monthsInBillingPeriod.yearly
	}));
	const monthlyTotalCents = monthlyLines.reduce((total, line) => total + line.amountCents, 0);
	if (annualFreeMonths === 0 || monthlyTotalCents === 0) return yearlyLines;
	return [
		...yearlyLines,
		{ label: `Paiement à l’année : ${annualFreeMonths} mois offerts`, amountCents: -monthlyTotalCents * annualFreeMonths }
	];
}

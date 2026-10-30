import type { BillingPeriod } from '../database/billingTables';

const moneyBackGuaranteeInDays = 30;

export const monthsInBillingPeriod: Record<BillingPeriod, number> = { monthly: 1, yearly: 12 };

/** La fin d'une période qui commence à `periodStart` : un mois ou un an plus tard. */
export function computePeriodEnd(periodStart: Date, billingPeriod: BillingPeriod): Date {
	return addMonths(periodStart, monthsInBillingPeriod[billingPeriod]);
}

/** Le début de la période qui finit à `periodEnd`. */
export function computePeriodStart(periodEnd: Date, billingPeriod: BillingPeriod): Date {
	return addMonths(periodEnd, -monthsInBillingPeriod[billingPeriod]);
}

/** Satisfait ou remboursé : jusqu'à 30 jours après le début de l'abonnement. */
export function computeMoneyBackGuaranteeEnd(startedAt: Date): Date {
	return new Date(startedAt.getTime() + moneyBackGuaranteeInDays * 24 * 60 * 60 * 1000);
}

// Un 31 janvier + 1 mois donne le dernier jour de février, jamais le 3 mars.
function addMonths(date: Date, monthCount: number): Date {
	const shiftedDate = new Date(date);
	shiftedDate.setDate(1);
	shiftedDate.setMonth(shiftedDate.getMonth() + monthCount);
	const lastDayOfTargetMonth = new Date(shiftedDate.getFullYear(), shiftedDate.getMonth() + 1, 0).getDate();
	shiftedDate.setDate(Math.min(date.getDate(), lastDayOfTargetMonth));
	return shiftedDate;
}

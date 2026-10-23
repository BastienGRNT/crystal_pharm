const moneyBackGuaranteeInDays = 30;

/** La fin de la période mensuelle en cours : la date anniversaire suivante du début de l'abonnement. */
export function computeCurrentPeriodEnd(startedAt: Date, now: Date): Date {
	let elapsedMonths = 1;
	let periodEnd = addMonths(startedAt, elapsedMonths);
	while (periodEnd <= now) {
		elapsedMonths += 1;
		periodEnd = addMonths(startedAt, elapsedMonths);
	}
	return periodEnd;
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

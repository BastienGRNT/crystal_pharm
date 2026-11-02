/** Comment une pharmacie majore les heures faites au-delà de la durée hebdomadaire. */
export type OvertimeRules = {
	/** Au-delà, chaque heure est une heure supplémentaire. */
	weeklyThresholdMinutes: number;
	/** Les premières heures supplémentaires, majorées au premier taux. */
	firstBandMinutes: number;
	firstBandRatePercent: number;
	/** Le taux des heures qui suivent. */
	beyondRatePercent: number;
};

/** Convention collective de la pharmacie d'officine : 25 % de la 36e à la 43e heure, 50 % au-delà. */
export const collectiveAgreementOvertimeRules: OvertimeRules = {
	weeklyThresholdMinutes: 35 * 60,
	firstBandMinutes: 8 * 60,
	firstBandRatePercent: 25,
	beyondRatePercent: 50
};

export const overtimeRuleLimits = {
	weeklyThresholdMinutes: { min: 60, max: 48 * 60 },
	firstBandMinutes: { min: 0, max: 13 * 60 },
	firstBandRatePercent: { min: 10, max: 200 },
	beyondRatePercent: { min: 10, max: 200 }
} as const satisfies Record<keyof OvertimeRules, { min: number; max: number }>;

export type WeeklyOvertime = {
	regularMinutes: number;
	firstBandMinutes: number;
	beyondMinutes: number;
};

export function splitWeeklyOvertime(workedMinutes: number, rules: OvertimeRules): WeeklyOvertime {
	const regularMinutes = Math.min(workedMinutes, rules.weeklyThresholdMinutes);
	const overtimeMinutes = workedMinutes - regularMinutes;
	const firstBandMinutes = Math.min(overtimeMinutes, rules.firstBandMinutes);
	return { regularMinutes, firstBandMinutes, beyondMinutes: overtimeMinutes - firstBandMinutes };
}

export function sumOvertimeMinutes(overtime: WeeklyOvertime): number {
	return overtime.firstBandMinutes + overtime.beyondMinutes;
}

/** Les minutes de majoration seules : 60 minutes à 25 % en valent 15. */
export function computeOvertimePremiumMinutes(workedMinutes: number, rules: OvertimeRules): number {
	const overtime = splitWeeklyOvertime(workedMinutes, rules);
	return (overtime.firstBandMinutes * rules.firstBandRatePercent + overtime.beyondMinutes * rules.beyondRatePercent) / 100;
}

/** La majoration de la prochaine heure travaillée, une fois `workedMinutes` faites dans la semaine. */
export function readNextHourRatePercent(workedMinutes: number, rules: OvertimeRules): number {
	if (workedMinutes < rules.weeklyThresholdMinutes) return 0;
	return workedMinutes < rules.weeklyThresholdMinutes + rules.firstBandMinutes ? rules.firstBandRatePercent : rules.beyondRatePercent;
}

export function applyRatePercent(hourlyRateCents: number, ratePercent: number): number {
	return Math.round((hourlyRateCents * (100 + ratePercent)) / 100);
}

export type WeeklyPay = {
	overtime: WeeklyOvertime;
	/** Le salaire de la semaine, majorations comprises, hors charges. */
	totalCents: number;
	/** Ce que coûtent les majorations seules. */
	premiumCents: number;
	/** Le taux de la prochaine heure : il monte à mesure que la semaine se remplit. */
	nextHourRateCents: number;
};

export function computeWeeklyPay(workedMinutes: number, hourlyRateCents: number, rules: OvertimeRules): WeeklyPay {
	const premiumCents = Math.round((computeOvertimePremiumMinutes(workedMinutes, rules) / 60) * hourlyRateCents);
	return {
		overtime: splitWeeklyOvertime(workedMinutes, rules),
		totalCents: Math.round((workedMinutes / 60) * hourlyRateCents) + premiumCents,
		premiumCents,
		nextHourRateCents: applyRatePercent(hourlyRateCents, readNextHourRatePercent(workedMinutes, rules))
	};
}

export function formatEurosFromCents(cents: number): string {
	return (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

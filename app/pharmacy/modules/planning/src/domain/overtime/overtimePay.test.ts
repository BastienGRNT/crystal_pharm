import { describe, expect, it } from 'vitest';
import {
	collectiveAgreementOvertimeRules,
	computeOvertimePremiumMinutes,
	computeWeeklyPay,
	readNextHourRatePercent,
	splitWeeklyOvertime,
	type OvertimeRules
} from './overtimePay';

const hours = (count: number): number => count * 60;

describe('splitWeeklyOvertime', () => {
	it('ne compte rien en heures sup jusqu’à 35 h', () => {
		expect(splitWeeklyOvertime(hours(35), collectiveAgreementOvertimeRules)).toEqual({
			regularMinutes: hours(35),
			firstBandMinutes: 0,
			beyondMinutes: 0
		});
	});

	it('majore de 25 % de la 36e à la 43e heure, de 50 % au-delà', () => {
		expect(splitWeeklyOvertime(hours(46), collectiveAgreementOvertimeRules)).toEqual({
			regularMinutes: hours(35),
			firstBandMinutes: hours(8),
			beyondMinutes: hours(3)
		});
	});
});

describe('computeOvertimePremiumMinutes', () => {
	it('additionne les majorations des deux tranches', () => {
		// 8 h × 25 % + 2 h × 50 % = 3 h de majoration.
		expect(computeOvertimePremiumMinutes(hours(45), collectiveAgreementOvertimeRules)).toBe(hours(3));
	});

	it('suit les taux choisis par la pharmacie', () => {
		const pharmacyRules: OvertimeRules = { weeklyThresholdMinutes: hours(35), firstBandMinutes: hours(4), firstBandRatePercent: 50, beyondRatePercent: 100 };
		expect(computeOvertimePremiumMinutes(hours(40), pharmacyRules)).toBe(hours(2 + 1));
	});
});

describe('readNextHourRatePercent', () => {
	it('monte avec les heures de la semaine', () => {
		expect(readNextHourRatePercent(hours(34), collectiveAgreementOvertimeRules)).toBe(0);
		expect(readNextHourRatePercent(hours(35), collectiveAgreementOvertimeRules)).toBe(25);
		expect(readNextHourRatePercent(hours(43), collectiveAgreementOvertimeRules)).toBe(50);
	});
});

describe('computeWeeklyPay', () => {
	it('paie les heures sup au taux majoré et donne le taux de l’heure suivante', () => {
		const pay = computeWeeklyPay(hours(37), 2000, collectiveAgreementOvertimeRules);
		// 37 h × 20 € + 2 h × 5 € de majoration.
		expect(pay.totalCents).toBe(75_000);
		expect(pay.premiumCents).toBe(1000);
		expect(pay.nextHourRateCents).toBe(2500);
	});
});

import { describe, expect, it } from 'vitest';
import { siteTrafficDayCount, summarizeSiteTraffic, toHourStart } from './siteTrafficSummary';

const emptyReading = { dailyTraffic: [], hourlyBusyness: [], mostViewedPages: [] };

describe('summarizeSiteTraffic', () => {
	it('montre chaque jour de la période, à zéro s’il n’a rien eu', () => {
		const summary = summarizeSiteTraffic({ ...emptyReading, dailyTraffic: [{ day: '2026-11-01', viewCount: 9, visitCount: 4 }] }, '2026-11-01');

		expect(summary.days).toHaveLength(siteTrafficDayCount);
		expect(summary.days[0]).toEqual({ day: '2026-10-05', viewCount: 0, visitCount: 0 });
		expect(summary.days.at(-1)).toEqual({ day: '2026-11-01', viewCount: 9, visitCount: 4 });
	});

	it('compare les sept derniers jours aux sept d’avant', () => {
		const summary = summarizeSiteTraffic(
			{
				...emptyReading,
				dailyTraffic: [
					{ day: '2026-10-25', viewCount: 30, visitCount: 10 },
					{ day: '2026-10-26', viewCount: 40, visitCount: 15 }
				]
			},
			'2026-11-01'
		);

		expect(summary.previousWeekVisitCount).toBe(10);
		expect(summary.lastWeekVisitCount).toBe(15);
		expect(summary.lastWeekViewCount).toBe(40);
		expect(summary.visitTrendPercent).toBe(50);
	});

	it('ne donne pas de tendance sans visite la semaine d’avant', () => {
		expect(summarizeSiteTraffic(emptyReading, '2026-11-01').visitTrendPercent).toBeUndefined();
	});

	it('trouve le créneau le plus fréquenté', () => {
		const summary = summarizeSiteTraffic(
			{
				...emptyReading,
				hourlyBusyness: [
					{ weekday: 0, hour: 9, visitCount: 4 },
					{ weekday: 5, hour: 10, visitCount: 12 }
				]
			},
			'2026-11-01'
		);

		expect(summary.busiestSlot).toEqual({ weekday: 5, hour: 10 });
		expect(summary.busynessByWeekdayAndHour[5]?.[10]).toBe(12);
	});

	it('n’a pas de créneau le plus fréquenté sans visite', () => {
		expect(summarizeSiteTraffic(emptyReading, '2026-11-01').busiestSlot).toBeUndefined();
	});
});

describe('toHourStart', () => {
	it('arrondit au début de l’heure', () => {
		expect(toHourStart(new Date('2026-11-01T09:47:12.345Z'))).toEqual(new Date('2026-11-01T09:00:00Z'));
	});
});

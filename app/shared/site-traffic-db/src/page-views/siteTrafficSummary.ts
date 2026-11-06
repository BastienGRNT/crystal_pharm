/** Les jours et les heures sont ceux de la pharmacie. */
export const siteTrafficTimeZone = 'Europe/Paris';
/** La période montrée au Tenant, aujourd'hui compris. */
export const siteTrafficDayCount = 28;

export type DailySiteTraffic = { day: string; viewCount: number; visitCount: number };
/** 0 = lundi ; l'heure est celle du début du créneau. */
export type HourlySiteBusyness = { weekday: number; hour: number; visitCount: number };
export type MostViewedPage = { pagePath: string; viewCount: number };

/** Ce que la base rend : seulement les jours, heures et pages qui ont eu des vues. */
export type SiteTrafficReading = {
	dailyTraffic: DailySiteTraffic[];
	hourlyBusyness: HourlySiteBusyness[];
	mostViewedPages: MostViewedPage[];
};

export type SiteTrafficSummary = {
	/** Chaque jour de la période, du plus ancien à aujourd'hui, à zéro s'il n'a rien eu. */
	days: DailySiteTraffic[];
	lastWeekVisitCount: number;
	lastWeekViewCount: number;
	previousWeekVisitCount: number;
	/** `undefined` quand la semaine d'avant n'a eu aucune visite : rien à comparer. */
	visitTrendPercent: number | undefined;
	/** Les visites par jour (0 = lundi) puis par heure, sur toute la période. */
	busynessByWeekdayAndHour: number[][];
	busiestSlot: { weekday: number; hour: number } | undefined;
	mostViewedPages: MostViewedPage[];
};

const daysInWeek = 7;
const hoursInDay = 24;

export function summarizeSiteTraffic(reading: SiteTrafficReading, today: string): SiteTrafficSummary {
	const days = listPeriodDays(today).map(
		(day) => reading.dailyTraffic.find((dailyTraffic) => dailyTraffic.day === day) ?? { day, viewCount: 0, visitCount: 0 }
	);
	const lastWeek = days.slice(-daysInWeek);
	const previousWeek = days.slice(-2 * daysInWeek, -daysInWeek);
	const lastWeekVisitCount = sumVisits(lastWeek);
	const previousWeekVisitCount = sumVisits(previousWeek);
	const busynessByWeekdayAndHour = toBusynessGrid(reading.hourlyBusyness);
	return {
		days,
		lastWeekVisitCount,
		lastWeekViewCount: lastWeek.reduce((total, day) => total + day.viewCount, 0),
		previousWeekVisitCount,
		visitTrendPercent:
			previousWeekVisitCount === 0 ? undefined : Math.round(((lastWeekVisitCount - previousWeekVisitCount) / previousWeekVisitCount) * 100),
		busynessByWeekdayAndHour,
		busiestSlot: findBusiestSlot(busynessByWeekdayAndHour),
		mostViewedPages: reading.mostViewedPages
	};
}

/** Le début de l'heure de `instant` : les fuseaux de France sont décalés d'heures pleines. */
export function toHourStart(instant: Date): Date {
	const millisecondsInHour = 3_600_000;
	return new Date(Math.floor(instant.getTime() / millisecondsInHour) * millisecondsInHour);
}

function listPeriodDays(today: string): string[] {
	const todayAtNoon = new Date(`${today}T12:00:00Z`);
	return Array.from({ length: siteTrafficDayCount }, (_, index) => {
		const day = new Date(todayAtNoon);
		day.setUTCDate(day.getUTCDate() - (siteTrafficDayCount - 1 - index));
		return day.toISOString().slice(0, 10);
	});
}

function sumVisits(days: DailySiteTraffic[]): number {
	return days.reduce((total, day) => total + day.visitCount, 0);
}

function toBusynessGrid(hourlyBusyness: HourlySiteBusyness[]): number[][] {
	const grid = Array.from({ length: daysInWeek }, () => Array.from({ length: hoursInDay }, () => 0));
	for (const { weekday, hour, visitCount } of hourlyBusyness) {
		const weekdayRow = grid[weekday];
		if (weekdayRow && hour >= 0 && hour < hoursInDay) weekdayRow[hour] = visitCount;
	}
	return grid;
}

function findBusiestSlot(grid: number[][]): SiteTrafficSummary['busiestSlot'] {
	let busiestSlot: SiteTrafficSummary['busiestSlot'];
	let busiestVisitCount = 0;
	grid.forEach((hours, weekday) =>
		hours.forEach((visitCount, hour) => {
			if (visitCount <= busiestVisitCount) return;
			busiestVisitCount = visitCount;
			busiestSlot = { weekday, hour };
		})
	);
	return busiestSlot;
}

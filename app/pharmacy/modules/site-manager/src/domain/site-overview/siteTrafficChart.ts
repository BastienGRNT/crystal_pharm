import type { DailySiteTraffic, SiteTrafficSummary } from '@crystal-pharm/site-traffic-db/domain';
import type { ColumnChartColumn, HeatGridRow } from '@crystal-pharm/ui';

export type ShownHourRange = { firstHour: number; endHour: number };

const weekdayNames = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const daysInWeek = 7;
// Les heures montrées même sans visite : celles d'une journée de pharmacie.
const usualFirstHour = 8;
const usualEndHour = 20;

const dayLabelFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
const axisLabelFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });

export function describeVisitCount(visitCount: number): string {
	if (visitCount === 0) return 'Aucune visite';
	return `${visitCount.toLocaleString('fr-FR')} visite${visitCount > 1 ? 's' : ''}`;
}

/** Une colonne par jour ; les sept derniers en plein, une date sous chaque lundi. */
export function toDailyVisitColumns(days: DailySiteTraffic[]): ColumnChartColumn[] {
	return days.map((dailyTraffic, dayIndex) => {
		const day = toNoonOfDay(dailyTraffic.day);
		return {
			key: dailyTraffic.day,
			value: dailyTraffic.visitCount,
			label: dayLabelFormat.format(day),
			valueLabel: describeVisitCount(dailyTraffic.visitCount),
			axisLabel: day.getUTCDay() === 1 ? axisLabelFormat.format(day) : undefined,
			isEmphasized: dayIndex >= days.length - daysInWeek
		};
	});
}

/** Les heures d'une journée de pharmacie, élargies à celles qui ont eu des visites. */
export function findShownHourRange(busynessByWeekdayAndHour: number[][]): ShownHourRange {
	const visitedHours = busynessByWeekdayAndHour.flatMap((hours) => hours.flatMap((visitCount, hour) => (visitCount > 0 ? [hour] : [])));
	return {
		firstHour: Math.min(usualFirstHour, ...visitedHours),
		endHour: Math.max(usualEndHour, ...visitedHours.map((hour) => hour + 1))
	};
}

export function toBusynessRows(busynessByWeekdayAndHour: number[][], { firstHour, endHour }: ShownHourRange): HeatGridRow[] {
	return weekdayNames.map((weekdayName, weekday) => ({
		key: weekdayName,
		label: capitalize(weekdayName.slice(0, 3)),
		cells: listHours(firstHour, endHour).map((hour) => {
			const visitCount = busynessByWeekdayAndHour[weekday]?.[hour] ?? 0;
			return { value: visitCount, label: `${capitalize(weekdayName)} de ${hour} h à ${hour + 1} h : ${describeVisitCount(visitCount).toLowerCase()}` };
		})
	}));
}

/** Une heure sur deux : toutes, elles se chevaucheraient sur un petit écran. */
export function toHourColumnLabels({ firstHour, endHour }: ShownHourRange): string[] {
	return listHours(firstHour, endHour).map((hour) => (hour % 2 === 0 ? `${hour} h` : ''));
}

export function describeBusiestSlot(busiestSlot: SiteTrafficSummary['busiestSlot']): string | undefined {
	if (!busiestSlot) return undefined;
	const weekdayName = weekdayNames[busiestSlot.weekday] ?? '';
	return `${capitalize(weekdayName)}, ${busiestSlot.hour} h – ${busiestSlot.hour + 1} h`;
}

function listHours(firstHour: number, endHour: number): number[] {
	return Array.from({ length: endHour - firstHour }, (_, index) => firstHour + index);
}

function toNoonOfDay(day: string): Date {
	return new Date(`${day}T12:00:00Z`);
}

function capitalize(text: string): string {
	return text.charAt(0).toUpperCase() + text.slice(1);
}

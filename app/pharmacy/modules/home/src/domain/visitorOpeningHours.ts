import { weekdays, type WeeklyOpeningSchedule } from '@crystal-pharm/pharmacy-db/domain';
import { weekdayLabels } from './openingHoursDraft';

export type VisitorOpeningDay = {
	weekdayLabel: string;
	/** Une entrée par plage, « 09:00 – 12:30 » ; vide un jour fermé. */
	openingPeriodLabels: string[];
	isClosed: boolean;
};

// Reprend le texte d'une plage du moteur (`toOpeningHoursModuleProps`), que `home` n'a pas le droit d'importer :
// l'aperçu doit montrer au Manager exactement ce que lit le Visitor.

export function describeOpeningHoursForVisitor(weeklyOpeningSchedule: WeeklyOpeningSchedule): VisitorOpeningDay[] {
	return weekdays.map((weekday) => {
		const periods = weeklyOpeningSchedule[weekday];
		return {
			weekdayLabel: weekdayLabels[weekday],
			openingPeriodLabels: periods.map((period) => `${period.opensAt} – ${period.closesAt}`),
			isClosed: periods.length === 0
		};
	});
}

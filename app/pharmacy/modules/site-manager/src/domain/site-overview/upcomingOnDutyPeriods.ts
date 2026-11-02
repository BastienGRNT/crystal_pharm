import type { OnDutyPeriod } from '@crystal-pharm/schema';
import { describeOnDutyPeriodEnd, toOnDutyPeriodDraft } from '../onDutyPeriods';

export type UpcomingOnDutyPeriodSummary = {
	key: string;
	/** « sam. 8 nov. » */
	dayLabel: string;
	/** « 19:00 → 08:00 » */
	hoursLabel: string;
	endLabel: string;
	isOngoing: boolean;
};

const shortDayFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

export function summarizeUpcomingOnDutyPeriod(period: OnDutyPeriod, now: Date): UpcomingOnDutyPeriodSummary {
	const draft = toOnDutyPeriodDraft(period);
	return {
		key: period.startsAt,
		dayLabel: shortDayFormat.format(new Date(`${draft.day}T12:00:00Z`)),
		hoursLabel: `${draft.startTime} → ${draft.endTime}`,
		endLabel: describeOnDutyPeriodEnd(draft),
		isOngoing: new Date(period.startsAt) <= now && now < new Date(period.endsAt)
	};
}

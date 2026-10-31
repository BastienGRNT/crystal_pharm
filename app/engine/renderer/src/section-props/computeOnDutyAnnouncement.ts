import type { OnDutyPeriod } from '@crystal-pharm/schema';
import { formatInParisTimeZone } from '../module-props/formatInParisTimeZone';

export type OnDutyAnnouncement = {
  status: 'onDutyNow' | 'onDutyLaterToday';
  message: string;
};

export function computeOnDutyAnnouncement(onDutyPeriods: OnDutyPeriod[], renderedAt: Date): OnDutyAnnouncement | undefined {
  const today = formatDay(renderedAt);
  const periods = onDutyPeriods.map((period) => ({ startsAt: new Date(period.startsAt), endsAt: new Date(period.endsAt) }));

  const currentPeriod = periods.find((period) => period.startsAt <= renderedAt && renderedAt < period.endsAt);
  if (currentPeriod) {
    const endLabel = formatInParisTimeZone(currentPeriod.endsAt, {
      weekday: formatDay(currentPeriod.endsAt) === today ? undefined : 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
    return { status: 'onDutyNow', message: `En garde actuellement, jusqu'à ${endLabel}` };
  }

  const laterTodayPeriod = periods.find((period) => period.startsAt > renderedAt && formatDay(period.startsAt) === today);
  if (laterTodayPeriod) {
    const startLabel = formatInParisTimeZone(laterTodayPeriod.startsAt, { hour: '2-digit', minute: '2-digit' });
    return { status: 'onDutyLaterToday', message: `En garde ce soir, à partir de ${startLabel}` };
  }

  return undefined;
}

function formatDay(date: Date): string {
  return formatInParisTimeZone(date, { dateStyle: 'short' });
}

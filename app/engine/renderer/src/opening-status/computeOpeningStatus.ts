import type { OpeningHoursSectionData, Weekday } from '@crystal-pharm/schema';
import { formatInParisTimeZone } from '../module-props/formatInParisTimeZone';

export type OpeningStatus = {
  state: 'open' | 'closingSoon' | 'closed' | 'onDuty';
  /** Le mot qui se lit d'un coup d'œil : « Ouvert », « Fermé », « De garde »… */
  label: string;
  /** La suite, par exemple « ferme à 19 h 30 » ou « ouvre demain à 8 h 30 ». Vide si rien n'est prévu. */
  detail: string;
};

const weekdaysFromSunday: readonly Weekday[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const weekdayLabels: Record<Weekday, string> = {
  monday: 'lundi',
  tuesday: 'mardi',
  wednesday: 'mercredi',
  thursday: 'jeudi',
  friday: 'vendredi',
  saturday: 'samedi',
  sunday: 'dimanche',
};
const closingSoonMinutes = 30;

/** Ouvert ou fermé à l'instant `at`, à l'heure de Paris : la garde l'emporte sur les horaires. */
export function computeOpeningStatus(openingHours: OpeningHoursSectionData, at: Date): OpeningStatus {
  const onDutyPeriod = openingHours.onDutyPeriods.find((period) => new Date(period.startsAt) <= at && at < new Date(period.endsAt));
  if (onDutyPeriod) return { state: 'onDuty', label: 'De garde', detail: `jusqu’à ${toSpokenMoment(new Date(onDutyPeriod.endsAt), at)}` };

  const { weekdayIndex, time } = readParisClock(at);
  const today = weekdaysFromSunday[weekdayIndex] ?? 'monday';
  const currentPeriod = openingHours.weeklySchedule[today].find((period) => period.opensAt <= time && time < period.closesAt);
  if (currentPeriod) {
    const isClosingSoon = toMinutes(currentPeriod.closesAt) - toMinutes(time) <= closingSoonMinutes;
    return {
      state: isClosingSoon ? 'closingSoon' : 'open',
      label: isClosingSoon ? 'Ferme bientôt' : 'Ouvert',
      detail: `ferme à ${toSpokenTime(currentPeriod.closesAt)}`,
    };
  }
  return { state: 'closed', label: 'Fermé', detail: describeNextOpening(openingHours, weekdayIndex, time) };
}

function describeNextOpening(openingHours: OpeningHoursSectionData, todayIndex: number, time: string): string {
  for (let daysAhead = 0; daysAhead < 7; daysAhead += 1) {
    const weekday = weekdaysFromSunday[(todayIndex + daysAhead) % 7] ?? 'monday';
    const nextPeriod = openingHours.weeklySchedule[weekday].find((period) => daysAhead > 0 || period.opensAt > time);
    if (!nextPeriod) continue;
    const dayLabel = daysAhead === 0 ? '' : daysAhead === 1 ? 'demain ' : `${weekdayLabels[weekday]} `;
    return `ouvre ${dayLabel}à ${toSpokenTime(nextPeriod.opensAt)}`;
  }
  return '';
}

function readParisClock(at: Date): { weekdayIndex: number; time: string } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(at);
  const partValue = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  const weekdayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(partValue('weekday'));
  return { weekdayIndex, time: `${partValue('hour')}:${partValue('minute')}` };
}

function toMinutes(time: string): number {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/** « 08:30 » devient « 8 h 30 », « 14:00 » devient « 14 h », comme on l'écrit en français. */
export function toSpokenTime(time: string): string {
  const [hours = '0', minutes = '00'] = time.split(':');
  return minutes === '00' ? `${Number(hours)} h` : `${Number(hours)} h ${minutes}`;
}

function toSpokenMoment(moment: Date, now: Date): string {
  const time = toSpokenTime(formatInParisTimeZone(moment, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }));
  const isSameDay = formatInParisTimeZone(moment, { dateStyle: 'short' }) === formatInParisTimeZone(now, { dateStyle: 'short' });
  return isSameDay ? time : `${formatInParisTimeZone(moment, { weekday: 'long' })} ${time}`;
}

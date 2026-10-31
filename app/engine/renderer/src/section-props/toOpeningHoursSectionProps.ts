import type { OpeningHoursSectionData, Weekday } from '@crystal-pharm/schema';
import { formatInParisTimeZone } from '../module-props/formatInParisTimeZone';

export type OpeningHoursSectionProps = {
  days: Array<{
    label: string;
    /** Par exemple ['08:30 – 12:30', '14:00 – 19:30']. Vide si la pharmacie est fermée ce jour-là. */
    openingPeriodLabels: string[];
    isToday: boolean;
  }>;
};

const weekdaysInDisplayOrder: ReadonlyArray<{ weekday: Weekday; label: string }> = [
  { weekday: 'monday', label: 'Lundi' },
  { weekday: 'tuesday', label: 'Mardi' },
  { weekday: 'wednesday', label: 'Mercredi' },
  { weekday: 'thursday', label: 'Jeudi' },
  { weekday: 'friday', label: 'Vendredi' },
  { weekday: 'saturday', label: 'Samedi' },
  { weekday: 'sunday', label: 'Dimanche' },
];

export function toOpeningHoursSectionProps(data: OpeningHoursSectionData, renderedAt: Date): OpeningHoursSectionProps {
  const todayLabel = formatInParisTimeZone(renderedAt, { weekday: 'long' });
  return {
    days: weekdaysInDisplayOrder.map(({ weekday, label }) => ({
      label,
      openingPeriodLabels: data.weeklySchedule[weekday].map((period) => `${period.opensAt} – ${period.closesAt}`),
      isToday: label.toLowerCase() === todayLabel,
    })),
  };
}

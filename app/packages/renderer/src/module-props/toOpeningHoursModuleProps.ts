import type { OpeningHoursModuleData, Weekday } from '@crystal-pharm/schema';
import { computeOnDutyAnnouncement, type OnDutyAnnouncement } from './computeOnDutyAnnouncement';
import { formatInParisTimeZone } from './formatInParisTimeZone';

export type OpeningHoursModuleProps = {
  days: Array<{
    label: string;
    /** Par exemple ['08:30 – 12:30', '14:00 – 19:30']. Vide si la pharmacie est fermée ce jour-là. */
    openingPeriodLabels: string[];
    isToday: boolean;
  }>;
  onDutyAnnouncement?: OnDutyAnnouncement;
  /** Toujours affiché : le numéro national qui oriente vers la pharmacie de garde la plus proche. */
  onDutyHotline: { message: string; phoneNumber: string };
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

export function toOpeningHoursModuleProps(data: OpeningHoursModuleData, renderedAt: Date): OpeningHoursModuleProps {
  const todayLabel = formatInParisTimeZone(renderedAt, { weekday: 'long' });
  return {
    days: weekdaysInDisplayOrder.map(({ weekday, label }) => ({
      label,
      openingPeriodLabels: data.weeklySchedule[weekday].map((period) => `${period.opensAt} – ${period.closesAt}`),
      isToday: label.toLowerCase() === todayLabel,
    })),
    onDutyAnnouncement: computeOnDutyAnnouncement(data.onDutyPeriods, renderedAt),
    onDutyHotline: {
      message: 'En dehors de nos horaires, composez le 3237 pour trouver la pharmacie de garde la plus proche.',
      phoneNumber: '3237',
    },
  };
}

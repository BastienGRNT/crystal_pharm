import type { OpeningHoursSectionData } from '@crystal-pharm/schema';
import { computeOnDutyAnnouncement, type OnDutyAnnouncement } from './computeOnDutyAnnouncement';

export type OnDutySectionProps = {
  /** Absent quand la pharmacie n'est pas de garde aujourd'hui. */
  announcement?: OnDutyAnnouncement;
  /** Toujours affiché : le numéro national qui oriente vers la pharmacie de garde la plus proche. */
  hotline: { message: string; phoneNumber: string };
};

export function toOnDutySectionProps(data: OpeningHoursSectionData, renderedAt: Date): OnDutySectionProps {
  return {
    announcement: computeOnDutyAnnouncement(data.onDutyPeriods, renderedAt),
    hotline: {
      message: 'En dehors de nos horaires, composez le 3237 pour trouver la pharmacie de garde la plus proche.',
      phoneNumber: '3237',
    },
  };
}

import type { OpeningHoursSectionData } from '@crystal-pharm/schema';
import { computeOnDutyAnnouncement, type OnDutyAnnouncement } from './computeOnDutyAnnouncement';

export type OnDutySectionProps = {
  /** Absent quand la pharmacie n'est pas de garde aujourd'hui. */
  announcement?: OnDutyAnnouncement;
};

export function toOnDutySectionProps(data: OpeningHoursSectionData, renderedAt: Date): OnDutySectionProps {
  return {
    announcement: computeOnDutyAnnouncement(data.onDutyPeriods, renderedAt),
  };
}

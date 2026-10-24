import { isoTimestampInHoursFromNow } from '../isoTimestampInHoursFromNow';
import { demoPharmacyGroups } from '../demoPharmacyGroups';
import type { MockTenant } from '../MockTenant';
import { weekClosedOnMondayAndSaturdayAfternoon } from '../weeklySchedules';

export const pharmacieDuPort: MockTenant = {
  description: 'Le minimum : groupement sans logo, ni logo ni email, seulement les horaires et l’ordonnance. De garde dans une heure.',
  createTenantSite: () => ({
    tenantId: 'pharmacie-du-port',
    layoutId: 'atelier',
    apiBaseUrl: '/api',
    layoutSettings: { accentTone: 'sage' },
    pharmacy: {
      name: 'Pharmacie du Port',
      address: { street: '1 quai Duguay-Trouin', postalCode: '35400', city: 'Saint-Malo' },
      phone: '02 99 40 00 00',
      group: demoPharmacyGroups[2]?.group,
    },
    modules: {
      openingHours: {
        enabled: true,
        data: {
          weeklySchedule: weekClosedOnMondayAndSaturdayAfternoon,
          onDutyPeriods: [{ startsAt: isoTimestampInHoursFromNow(1), endsAt: isoTimestampInHoursFromNow(13) }],
        },
      },
      team: { enabled: false },
      services: { enabled: false },
      news: { enabled: false },
      prescriptionUpload: { enabled: true, data: {} },
      loyaltyCard: { enabled: false },
    },
  }),
};

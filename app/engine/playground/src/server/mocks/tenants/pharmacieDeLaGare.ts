import { demoPharmacyGroups } from '../demoPharmacyGroups';
import { isoTimestampInHoursFromNow } from '../isoTimestampInHoursFromNow';
import { mockImageUrl } from '../mockImageUrl';
import type { MockTenant } from '../MockTenant';
import { createSampleFixedSectionsData, createSampleModuleData } from '../sampleModuleData';
import { weekWithoutBreakOpenOnSunday } from '../weeklySchedules';

export const pharmacieDeLaGare: MockTenant = {
  description: 'Enseigne, complète : groupement, tous les modules, photos partout, de garde plus tard dans la journée (bandeau de garde).',
  createTenantSite: () => {
    const sampleModuleData = createSampleModuleData();
    const sampleFixedSectionsData = createSampleFixedSectionsData();
    return {
      tenantId: 'pharmacie-de-la-gare',
      layoutId: 'signboard',
      pharmacy: {
        name: 'Pharmacie de la Gare',
        address: { street: '18 place de la Gare', postalCode: '59000', city: 'Lille' },
        phone: '03 20 06 12 34',
        email: 'contact@pharmacie-gare-lille.fr',
        logoUrl: mockImageUrl('logo', 'Pharmacie de la Gare'),
        group: demoPharmacyGroups[1]?.group,
      },
      fixedSections: {
        hero: { imageUrl: mockImageUrl('hero', 'Pharmacie de la Gare'), headline: 'Ouverte tard, à deux pas des quais.' },
        findUs: sampleFixedSectionsData.findUs,
        openingHours: {
          weeklySchedule: weekWithoutBreakOpenOnSunday,
          onDutyPeriods: [{ startsAt: isoTimestampInHoursFromNow(3), endsAt: isoTimestampInHoursFromNow(15) }],
        },
      },
      modules: {
        team: { enabled: true, data: sampleModuleData.team },
        services: { enabled: true, data: sampleModuleData.services },
        news: { enabled: true, data: sampleModuleData.news },
        prescriptionUpload: { enabled: true, data: sampleModuleData.prescriptionUpload },
        loyaltyCard: { enabled: true, data: sampleModuleData.loyaltyCard },
        brands: { enabled: true, data: sampleModuleData.brands },
        appointment: { enabled: true, data: sampleModuleData.appointment },
        onlineOrder: { enabled: true, data: sampleModuleData.onlineOrder },
        dutyHotline: { enabled: true, data: sampleModuleData.dutyHotline },
      },
    };
  },
};

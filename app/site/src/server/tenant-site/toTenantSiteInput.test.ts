import type { GroupSiteProfileOfTenant } from '@crystal-pharm/group-db';
import { PhoneNumber } from '@crystal-pharm/pharmacy-db/domain';
import { TenantSiteSchema } from '@crystal-pharm/schema';
import * as v from 'valibot';
import { describe, expect, it } from 'vitest';
import { toTenantSiteInput, type TenantSiteSources } from './toTenantSiteInput';

const pharmacyArticle = { title: 'Campagne grippe', summary: 'Dès le 15 octobre.', publishedAt: '2026-10-01' };
const groupArticle = { title: '-10 % sur la parapharmacie', summary: 'Tout le mois de novembre.', publishedAt: '2026-10-20' };

const group: GroupSiteProfileOfTenant = {
  groupId: '00000000-0000-4000-8000-000000000010',
  name: 'Groupement Santé',
  logoId: undefined,
  loyaltyCardImageId: undefined,
  loyaltyCardUrl: undefined,
  loyaltyCardMessage: undefined,
  mandatoryModules: [],
  imposesGroupNews: false,
  articles: [{ articleId: '00000000-0000-4000-8000-000000000020', ...groupArticle }],
};

const sources: TenantSiteSources = {
  tenantId: '00000000-0000-4000-8000-000000000001',
  content: {
    layoutId: 'essential',
    layoutSettings: {},
    layoutSettingsByLayoutId: {},
    enabledModules: ['news'],
    services: [],
    prescriptionIntroduction: undefined,
    newsSource: 'pharmacy',
    articles: [pharmacyArticle],
  },
  pharmacyProfile: {
    name: 'Pharmacie Dupont',
    street: '1 rue de la Paix',
    postalCode: '75002',
    city: 'Paris',
    phoneNumber: PhoneNumber.parse('01 23 45 67 89') ?? PhoneNumber.fromStorageFormat('+33123456789'),
    email: undefined,
    weeklyOpeningSchedule: undefined,
  },
  employees: [],
  group,
};

function withNewsSettings(newsSource: 'pharmacy' | 'group', groupChanges: Partial<GroupSiteProfileOfTenant>): TenantSiteSources {
  return { ...sources, content: { ...sources.content, newsSource }, group: { ...group, ...groupChanges } };
}

describe('les actualités du site public', () => {
  it('shows the pharmacy’s own news when it chooses them', () => {
    const { tenantSiteInput } = toTenantSiteInput(withNewsSettings('pharmacy', {}));

    expect(tenantSiteInput.modules.news).toEqual({ enabled: true, data: { articles: [pharmacyArticle] } });
  });

  it('shows the group’s news, without their identifiers, when the pharmacy chooses them', () => {
    const { tenantSiteInput } = toTenantSiteInput(withNewsSettings('group', {}));

    expect(tenantSiteInput.modules.news).toEqual({ enabled: true, data: { articles: [groupArticle] } });
  });

  it('shows the group’s news when the group imposes them, whatever the pharmacy chose', () => {
    const { tenantSiteInput } = toTenantSiteInput(withNewsSettings('pharmacy', { imposesGroupNews: true }));

    expect(tenantSiteInput.modules.news).toEqual({ enabled: true, data: { articles: [groupArticle] } });
  });

  it('hides the block, and reports it, when the group imposes news but has published none', () => {
    const { tenantSiteInput, isGroupNewsMissing, unavailableMandatoryModules } = toTenantSiteInput(
      withNewsSettings('pharmacy', { imposesGroupNews: true, mandatoryModules: ['news'], articles: [] }),
    );

    expect(tenantSiteInput.modules.news.enabled).toBe(false);
    expect(isGroupNewsMissing).toBe(true);
    expect(unavailableMandatoryModules).toEqual(['news']);
    expect(v.safeParse(TenantSiteSchema, tenantSiteInput).success).toBe(true);
  });

  it('does not report missing group news when the news block is not shown anyway', () => {
    const { isGroupNewsMissing } = toTenantSiteInput({
      ...withNewsSettings('group', { articles: [] }),
      content: { ...sources.content, newsSource: 'group', enabledModules: [] },
    });

    expect(isGroupNewsMissing).toBe(false);
  });

  it('falls back to the pharmacy’s own news when it left its group', () => {
    const { tenantSiteInput } = toTenantSiteInput({ ...withNewsSettings('group', {}), group: undefined });

    expect(tenantSiteInput.modules.news).toEqual({ enabled: true, data: { articles: [pharmacyArticle] } });
  });
});

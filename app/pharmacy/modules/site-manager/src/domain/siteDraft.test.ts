import { TenantSiteSchema } from '@crystal-pharm/schema';
import * as v from 'valibot';
import { describe, expect, it } from 'vitest';
import { toTenantSiteInput, type SiteDraft, type SiteEditorBase } from './siteDraft';
import { listSiteModuleChoices } from './siteModuleChoices';

const baseWithoutGroup: SiteEditorBase = {
	tenantId: '00000000-0000-4000-8000-000000000001',
	pharmacy: {
		name: 'Pharmacie Dupont',
		address: { street: '1 rue de la Paix', postalCode: '75002', city: 'Paris' },
		phone: '01 23 45 67 89'
	},
	group: undefined,
	availableModuleData: {
		team: { members: [{ fullName: 'Marie Dupont', role: 'Pharmacienne' }] },
		loyaltyCard: { text: '-10 % sur la parapharmacie', url: 'https://groupement.example/carte' }
	}
};

const baseWithGroup: SiteEditorBase = {
	...baseWithoutGroup,
	group: { name: 'Groupement Santé', mandatoryModules: ['loyaltyCard', 'news'] }
};

const emptyDraft: SiteDraft = { layoutId: 'essential', layoutSettings: {}, enabledModules: [], services: [], articles: [] };

describe('toTenantSiteInput', () => {
	it('shows a module only when the Manager enables it and it has data', () => {
		const tenantSiteInput = toTenantSiteInput(baseWithoutGroup, { ...emptyDraft, enabledModules: ['team', 'news'] });

		expect(tenantSiteInput.modules.team.enabled).toBe(true);
		expect(tenantSiteInput.modules.news.enabled).toBe(false);
		expect(tenantSiteInput.modules.loyaltyCard.enabled).toBe(false);
	});

	it('adds the modules the group imposes, and drops those with nothing to show so the site stays valid', () => {
		const tenantSiteInput = toTenantSiteInput(baseWithGroup, emptyDraft);

		expect(tenantSiteInput.modules.loyaltyCard.enabled).toBe(true);
		expect(tenantSiteInput.pharmacy.group?.mandatoryModules).toEqual(['loyaltyCard']);
		expect(v.safeParse(TenantSiteSchema, tenantSiteInput).success).toBe(true);
	});

	it('shows the services and news typed in the editor, leaving half-filled rows out', () => {
		const tenantSiteInput = toTenantSiteInput(baseWithoutGroup, {
			...emptyDraft,
			enabledModules: ['services', 'news'],
			services: [
				{ title: 'Vaccination', description: 'Grippe et covid, sans rendez-vous.', iconName: 'syringe' },
				{ title: 'Tests', description: '', iconName: '' }
			],
			articles: [{ title: 'Campagne grippe', summary: 'Dès le 15 octobre.', publishedAt: '2026-10-01' }]
		});

		expect(tenantSiteInput.modules.services).toEqual({
			enabled: true,
			data: { services: [{ title: 'Vaccination', description: 'Grippe et covid, sans rendez-vous.', iconName: 'syringe' }] }
		});
		expect(tenantSiteInput.modules.news.enabled).toBe(true);
		expect(v.safeParse(TenantSiteSchema, tenantSiteInput).success).toBe(true);
	});
});

describe('listSiteModuleChoices', () => {
	it('tells imposed, optional and unavailable modules apart', () => {
		const statesByModule = Object.fromEntries(
			listSiteModuleChoices(baseWithGroup, emptyDraft).map((moduleChoice) => [moduleChoice.moduleName, moduleChoice.state.kind])
		);

		expect(statesByModule).toEqual({
			openingHours: 'unavailable',
			team: 'optional',
			services: 'unavailable',
			news: 'unavailable',
			prescriptionUpload: 'unavailable',
			loyaltyCard: 'mandatory'
		});
	});

	it('makes news imposed by the group as soon as an article is complete', () => {
		const newsChoice = listSiteModuleChoices(baseWithGroup, {
			services: [],
			articles: [{ title: 'Campagne grippe', summary: 'Dès le 15 octobre.', publishedAt: '2026-10-01' }]
		}).find((moduleChoice) => moduleChoice.moduleName === 'news');

		expect(newsChoice?.state.kind).toBe('mandatory');
	});
});

import { TenantSiteSchema } from '@crystal-pharm/schema';
import * as v from 'valibot';
import { describe, expect, it } from 'vitest';
import { toTenantSiteInput, type SiteDraft, type SiteEditorBase } from './siteDraft';
import { createEmptySectionDrafts } from './siteSectionDrafts';
import { listSiteModuleChoices } from './siteModuleChoices';

const baseWithoutGroup: SiteEditorBase = {
	tenantId: '00000000-0000-4000-8000-000000000001',
	pharmacy: {
		name: 'Pharmacie Dupont',
		address: { street: '1 rue de la Paix', postalCode: '75002', city: 'Paris' },
		phone: '01 23 45 67 89'
	},
	group: undefined,
	openingHours: undefined,
	onDutyPeriods: [],
	uploadedImagePreviewUrls: {},
	availableModuleData: {
		team: { members: [{ fullName: 'Marie Dupont', role: 'Pharmacienne' }] },
		prescriptionUpload: {},
		dutyHotline: {},
		loyaltyCard: { text: '-10 % sur la parapharmacie', url: 'https://groupement.example/carte' }
	}
};

const baseWithGroup: SiteEditorBase = {
	...baseWithoutGroup,
	group: { name: 'Groupement Santé', mandatoryModules: ['loyaltyCard', 'news'], imposesGroupNews: false, articles: [] }
};

const groupArticle = { title: '-10 % sur la parapharmacie', summary: 'Tout le mois de novembre.', publishedAt: '2026-10-20' };
const pharmacyArticle = { title: 'Campagne grippe', summary: 'Dès le 15 octobre.', publishedAt: '2026-10-01' };

const baseWithGroupNews: SiteEditorBase = {
	...baseWithoutGroup,
	group: { name: 'Groupement Santé', mandatoryModules: [], imposesGroupNews: false, articles: [groupArticle] }
};

const baseWithImposedGroupNews: SiteEditorBase = {
	...baseWithoutGroup,
	group: { name: 'Groupement Santé', mandatoryModules: [], imposesGroupNews: true, articles: [groupArticle] }
};

const emptyDraft: SiteDraft = {
	layoutId: 'essential',
	layoutSettings: {},
	enabledModules: [],
	moduleOrder: [],
	sections: createEmptySectionDrafts(),
	services: [],
	brands: [],
	articles: [],
	newsSource: 'pharmacy'
};

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
			team: 'optional',
			services: 'unavailable',
			news: 'unavailable',
			brands: 'unavailable',
			appointment: 'optional',
			onlineOrder: 'unavailable',
			prescriptionUpload: 'optional',
			dutyHotline: 'optional',
			loyaltyCard: 'mandatory'
		});
	});

	it('makes news imposed by the group as soon as an article is complete', () => {
		const newsChoice = listSiteModuleChoices(baseWithGroup, {
			sections: createEmptySectionDrafts(),
			services: [],
			brands: [],
			articles: [pharmacyArticle],
			newsSource: 'pharmacy'
		}).find((moduleChoice) => moduleChoice.moduleName === 'news');

		expect(newsChoice?.state.kind).toBe('mandatory');
	});
});

describe('les actualités affichées', () => {
	const draftShowingNews: SiteDraft = { ...emptyDraft, enabledModules: ['news'], articles: [pharmacyArticle] };

	it('shows the pharmacy’s own news when it chooses them', () => {
		const tenantSiteInput = toTenantSiteInput(baseWithGroupNews, draftShowingNews);

		expect(tenantSiteInput.modules.news).toEqual({ enabled: true, data: { articles: [pharmacyArticle] } });
	});

	it('shows the group’s news when the pharmacy chooses them', () => {
		const tenantSiteInput = toTenantSiteInput(baseWithGroupNews, { ...draftShowingNews, newsSource: 'group' });

		expect(tenantSiteInput.modules.news).toEqual({ enabled: true, data: { articles: [groupArticle] } });
	});

	it('shows the group’s news when the group imposes them, whatever the pharmacy chose', () => {
		const tenantSiteInput = toTenantSiteInput(baseWithImposedGroupNews, draftShowingNews);

		expect(tenantSiteInput.modules.news).toEqual({ enabled: true, data: { articles: [groupArticle] } });
	});

	it('hides the news block when the group imposes its news but has published none', () => {
		const baseWithImposedEmptyGroupNews: SiteEditorBase = {
			...baseWithImposedGroupNews,
			group: { name: 'Groupement Santé', mandatoryModules: ['news'], imposesGroupNews: true, articles: [] }
		};

		const tenantSiteInput = toTenantSiteInput(baseWithImposedEmptyGroupNews, draftShowingNews);

		expect(tenantSiteInput.modules.news.enabled).toBe(false);
		expect(v.safeParse(TenantSiteSchema, tenantSiteInput).success).toBe(true);
	});

	it('ignores a choice of group news when the pharmacy has no group', () => {
		const tenantSiteInput = toTenantSiteInput(baseWithoutGroup, { ...draftShowingNews, newsSource: 'group' });

		expect(tenantSiteInput.modules.news).toEqual({ enabled: true, data: { articles: [pharmacyArticle] } });
	});

	it('keeps the group’s own fields out of the site data', () => {
		const tenantSiteInput = toTenantSiteInput(baseWithGroupNews, emptyDraft);

		expect(tenantSiteInput.pharmacy.group).toEqual({ name: 'Groupement Santé', logoUrl: undefined, mandatoryModules: [] });
	});

	it('explains why group news cannot show yet', () => {
		const baseWithEmptyGroupNews: SiteEditorBase = {
			...baseWithGroupNews,
			group: { name: 'Groupement Santé', mandatoryModules: [], imposesGroupNews: false, articles: [] }
		};

		const newsChoice = listSiteModuleChoices(baseWithEmptyGroupNews, { ...emptyDraft, newsSource: 'group' }).find(
			(moduleChoice) => moduleChoice.moduleName === 'news'
		);

		expect(newsChoice?.state).toEqual({
			kind: 'unavailable',
			reason: 'Votre groupement n’a encore publié aucune actualité.',
			fixHref: undefined
		});
	});
});

describe('les images et sections saisies', () => {
	it('turns every image choice into an address for the preview', () => {
		const base = { ...baseWithoutGroup, uploadedImagePreviewUrls: { '00000000-0000-4000-8000-0000000000aa': 'https://preview.example/token' } };
		const tenantSiteInput = toTenantSiteInput(base, {
			...emptyDraft,
			enabledModules: ['brands', 'services'],
			sections: {
				...createEmptySectionDrafts(),
				hero: { headline: 'Bienvenue', image: { kind: 'upload', imageId: '00000000-0000-4000-8000-0000000000aa' } }
			},
			brands: [{ name: 'Avène', url: '', logo: { kind: 'link', url: 'https://avene.example/logo.png' } }],
			services: [{ title: 'Tests', description: 'Rapides.', iconName: '', icon: { kind: 'link', url: 'https://icone.example/a.svg' } }]
		});

		expect(tenantSiteInput.fixedSections.hero).toEqual({ headline: 'Bienvenue', imageUrl: 'https://preview.example/token' });
		expect(tenantSiteInput.modules.brands).toEqual({ enabled: true, data: { brands: [{ name: 'Avène', logoUrl: 'https://avene.example/logo.png' }] } });
		expect(tenantSiteInput.modules.services).toMatchObject({ data: { services: [{ iconUrl: 'https://icone.example/a.svg' }] } });
		expect(v.safeParse(TenantSiteSchema, tenantSiteInput).success).toBe(true);
	});

	it('offers the built-in appointments by default and an external link when chosen', () => {
		const builtIn = toTenantSiteInput(baseWithoutGroup, { ...emptyDraft, enabledModules: ['appointment'] });
		const external = toTenantSiteInput(baseWithoutGroup, {
			...emptyDraft,
			enabledModules: ['appointment', 'onlineOrder'],
			sections: {
				...createEmptySectionDrafts(),
				appointment: { mode: 'externalLink', introduction: '', url: 'https://rdv.example' },
				onlineOrder: { url: 'https://commande.example', introduction: '' }
			}
		});

		expect(builtIn.modules.appointment).toEqual({ enabled: true, data: { mode: 'builtIn' } });
		expect(external.modules.appointment).toEqual({ enabled: true, data: { mode: 'externalLink', url: 'https://rdv.example' } });
		expect(external.modules.onlineOrder).toEqual({ enabled: true, data: { url: 'https://commande.example' } });
	});

	it('keeps the order the Manager chose and a closed week when no opening hours are filled in', () => {
		const tenantSiteInput = toTenantSiteInput(baseWithoutGroup, { ...emptyDraft, moduleOrder: ['news', 'team'] });

		expect(tenantSiteInput.moduleOrder).toEqual(['news', 'team']);
		expect(tenantSiteInput.fixedSections.openingHours.weeklySchedule.monday).toEqual([]);
		expect(v.safeParse(TenantSiteSchema, tenantSiteInput).success).toBe(true);
	});
});

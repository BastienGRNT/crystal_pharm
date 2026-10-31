import { describe, expect, it } from 'vitest';
import { assembleDisplayedTenantSite, type DisplayedTenantSiteSources } from './displayedTenantSite';

const teamMember = { fullName: 'Claire Martin', role: 'Pharmacienne' };
const article = { title: 'Vaccination', summary: 'La campagne commence.', publishedAt: '2026-10-24' };

function assemble(sources: Partial<DisplayedTenantSiteSources>) {
	return assembleDisplayedTenantSite({
		tenantId: '87bfdec3-cd65-4966-8447-752d4b1c51f8',
		layoutId: 'neighborhood',
		layoutSettings: {},
		enabledModules: [],
		moduleOrder: [],
		fixedSections: { hero: {}, findUs: {}, openingHours: undefined },
		pharmacy: { name: 'Pharmacie du Port', address: { street: '1 quai', postalCode: '76600', city: 'Le Havre' }, phone: '02 35 00 00 00' },
		group: undefined,
		moduleData: {},
		...sources
	});
}

describe('assembleDisplayedTenantSite', () => {
	it('affiche un module choisi qui a des données', () => {
		const { tenantSiteInput } = assemble({ enabledModules: ['team'], moduleData: { team: { members: [teamMember] } } });

		expect(tenantSiteInput.modules.team).toEqual({ enabled: true, data: { members: [teamMember] } });
	});

	it('n’affiche pas un module qui a des données mais n’est pas choisi', () => {
		const { tenantSiteInput } = assemble({ moduleData: { team: { members: [teamMember] } } });

		expect(tenantSiteInput.modules.team).toEqual({ enabled: false });
	});

	it('masque une liste vide, même choisie', () => {
		const { tenantSiteInput } = assemble({
			enabledModules: ['team', 'services', 'news'],
			moduleData: { team: { members: [] }, services: { services: [] }, news: { articles: [] } }
		});

		expect(tenantSiteInput.modules).toMatchObject({ team: { enabled: false }, services: { enabled: false }, news: { enabled: false } });
	});

	it('affiche un module imposé par le groupement, même non choisi', () => {
		const { tenantSiteInput, unavailableMandatoryModules } = assemble({
			group: { name: 'Pharma+', logoUrl: '/logo', mandatoryModules: ['news'] },
			moduleData: { news: { articles: [article] } }
		});

		expect(tenantSiteInput.modules.news).toEqual({ enabled: true, data: { articles: [article] } });
		expect(tenantSiteInput.pharmacy.group).toEqual({ name: 'Pharma+', logoUrl: '/logo', mandatoryModules: ['news'] });
		expect(unavailableMandatoryModules).toEqual([]);
	});

	it('masque et signale un module imposé sans données, et ignore un nom qui n’est plus un module', () => {
		const { tenantSiteInput, unavailableMandatoryModules } = assemble({
			group: { name: 'Pharma+', logoUrl: undefined, mandatoryModules: ['loyaltyCard', 'ancienModule'] }
		});

		expect(tenantSiteInput.modules.loyaltyCard).toEqual({ enabled: false });
		expect(tenantSiteInput.pharmacy.group?.mandatoryModules).toEqual([]);
		expect(unavailableMandatoryModules).toEqual(['loyaltyCard']);
	});

	it('masque une liste de marques vide, et affiche une liste remplie', () => {
		const brands = { brands: [{ name: 'La Roche-Posay' }] };

		expect(assemble({ enabledModules: ['brands'], moduleData: { brands: { brands: [] } } }).tenantSiteInput.modules.brands).toEqual({ enabled: false });
		expect(assemble({ enabledModules: ['brands'], moduleData: { brands } }).tenantSiteInput.modules.brands).toEqual({ enabled: true, data: brands });
	});

	it('garde l’ordre voulu sans doublon, et montre une semaine fermée tant que les horaires manquent', () => {
		const { tenantSiteInput } = assemble({ moduleOrder: ['news', 'team', 'news'] });

		expect(tenantSiteInput.moduleOrder).toEqual(['news', 'team']);
		expect(tenantSiteInput.fixedSections.openingHours.weeklySchedule.monday).toEqual([]);
	});
});

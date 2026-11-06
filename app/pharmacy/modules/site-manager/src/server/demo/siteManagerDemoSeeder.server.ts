import { findLayoutManifest, layoutManifests } from '@crystal-pharm/layouts/manifest';
import { ModuleNameSchema, TenantSiteSchema } from '@crystal-pharm/schema';
import * as v from 'valibot';
import { toLayoutSettings, toLayoutSettingsFormValues } from '../../domain/layoutSettingsForm';
import { listModulesInDisplayOrder } from '../../domain/moduleOrder';
import { toOnDutyPeriod } from '../../domain/onDutyPeriods';
import { readSiteContentLists, toParisCalendarDate, type ArticleDraft, type BrandDraft, type ServiceDraft } from '../../domain/siteContentLists';
import { collectAvailableModuleData, toTenantSiteInput, type SiteDraft } from '../../domain/siteDraft';
import { readSectionDrafts, type SectionDrafts } from '../../domain/siteSectionDrafts';
import { saveOnDutyPeriods } from '../repositories/onDutyPeriodsRepository.server';
import { deleteSiteOfTenant, readSiteEditorSources, saveSiteEdition } from '../repositories/tenantSiteRepository.server';
import { ensureSiteSubdomain } from '../site-address/siteAddress.server';
import { toSiteEditorBase } from '../site-editor/toSiteEditorBase.server';

const preferredDemoLayoutId = 'neighborhood';
const millisecondsPerDay = 24 * 60 * 60 * 1000;

const demoSections: SectionDrafts = {
	hero: { headline: 'Votre pharmacie de quartier, à deux pas de la cathédrale', image: { kind: 'suggestion', suggestionKey: 'green-meadow' } },
	findUs: {
		latitude: '48.5817',
		longitude: '7.7503',
		accessInstructions: 'Entrée de plain-pied, au coin de la rue Saint-Louis et de la rue des Orfèvres.',
		parking: 'Parking Gutenberg à 200 m, 15 minutes offertes sur présentation du ticket.',
		publicTransport: 'Tram A et D, arrêt Langstross Grand’Rue.'
	},
	appointment: { mode: 'builtIn', introduction: 'Vaccination, test angine ou entretien : choisissez votre créneau en ligne.', url: '' },
	onlineOrder: { url: 'https://example.com/click-and-collect', introduction: 'Commandez en ligne, retirez au comptoir en 2 heures.' }
};

const demoServices: ServiceDraft[] = [
	{ title: 'Vaccination', description: 'Grippe, Covid-19 et rappels adultes, sans ordonnance.', iconName: 'syringe' },
	{ title: 'Tests rapides', description: 'Angine et cystite, résultat en 10 minutes.', iconName: 'test-tube' },
	{ title: 'Suivi de la tension', description: 'Prise de tension gratuite et conseils personnalisés.', iconName: 'heart-pulse' },
	{ title: 'Phytothérapie', description: 'Plantes et huiles essentielles, conseillées par nos pharmaciens.', iconName: 'leaf' }
];

const demoBrands: BrandDraft[] = [
	{ name: 'Avène', url: 'https://example.com/avene' },
	{ name: 'La Roche-Posay', url: 'https://example.com/la-roche-posay' },
	{ name: 'Weleda', url: '' }
];

function createDemoArticles(now: Date): ArticleDraft[] {
	return [
		{ title: 'La vaccination antigrippale a commencé', summary: 'Venez sans rendez-vous ou réservez votre créneau en ligne.', publishedAt: daysAgo(now, 3) },
		{ title: 'Nouveau : le retrait en 2 heures', summary: 'Commandez en ligne vos produits de parapharmacie, ils vous attendent au comptoir.', publishedAt: daysAgo(now, 18) }
	];
}

/** Le site publié de la pharmacie de démo, par le même chemin de validation que l'éditeur. */
export async function seedSiteManagerDemoData(tenantId: string): Promise<void> {
	const now = new Date();
	const manifest = findLayoutManifest(preferredDemoLayoutId) ?? layoutManifests[0];
	if (!manifest) throw new Error('No layout exists to build the demo site.');
	const layoutSettingsReading = toLayoutSettings(manifest, toLayoutSettingsFormValues(manifest.settingsFields, {}));
	if (!layoutSettingsReading.success) throw new Error(`The default settings of the layout ${manifest.layoutId} are invalid.`);
	const sectionsReading = readSectionDrafts(demoSections);
	if (!sectionsReading.success) throw new Error(sectionsReading.formError);
	const articles = createDemoArticles(now);
	const contentListsReading = readSiteContentLists(demoServices, articles, demoBrands);
	if (!contentListsReading.success) throw new Error(contentListsReading.formError);

	const base = toSiteEditorBase(tenantId, await readSiteEditorSources(tenantId));
	const contentDraft = { layoutId: manifest.layoutId, sections: demoSections, services: demoServices, brands: demoBrands, articles, newsSource: 'pharmacy' as const };
	const availableModuleData = collectAvailableModuleData(base, contentDraft);
	const enabledModules = ModuleNameSchema.options.filter((moduleName) => availableModuleData[moduleName] !== undefined);
	const draft: SiteDraft = {
		...contentDraft,
		layoutId: manifest.layoutId,
		layoutSettings: layoutSettingsReading.layoutSettings,
		enabledModules,
		moduleOrder: listModulesInDisplayOrder([])
	};
	const siteValidation = v.safeParse(TenantSiteSchema, toTenantSiteInput(base, draft));
	if (!siteValidation.success) throw new Error(`The demo site is invalid: ${siteValidation.issues[0].message}`);

	await saveSiteEdition(tenantId, {
		layoutId: draft.layoutId,
		layoutSettings: draft.layoutSettings,
		enabledModules: draft.enabledModules,
		moduleOrder: draft.moduleOrder,
		...sectionsReading.stored,
		services: contentListsReading.services,
		brands: contentListsReading.brands,
		articles: contentListsReading.articles,
		newsSource: draft.newsSource
	});
	await saveOnDutyPeriods(tenantId, createDemoOnDutyPeriods(now));
	await ensureSiteSubdomain(tenantId, base.pharmacy.name);
}

/** Avant de supprimer une pharmacie de démo : son adresse resterait sinon prise pour la suivante. */
export async function deleteSiteManagerDemoData(tenantId: string): Promise<void> {
	await deleteSiteOfTenant(tenantId);
}

// Une garde ce soir, pour voir le bandeau tout de suite, et la suivante une semaine plus tard.
function createDemoOnDutyPeriods(now: Date) {
	return [0, 7].flatMap((dayOffset) => {
		const period = toOnDutyPeriod({ day: daysAgo(now, -dayOffset), startTime: '19:30', endTime: '08:30' });
		return period ? [period] : [];
	});
}

function daysAgo(now: Date, dayCount: number): string {
	return toParisCalendarDate(new Date(now.getTime() - dayCount * millisecondsPerDay));
}

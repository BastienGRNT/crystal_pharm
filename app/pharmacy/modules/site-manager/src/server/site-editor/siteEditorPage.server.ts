import type { AuthenticatedUser } from '@crystal-pharm/auth';
import { findLayoutManifest, layoutManifests } from '@crystal-pharm/layouts/manifest';
import { ModuleNameSchema, TenantSiteSchema, type ModuleName } from '@crystal-pharm/schema';
import { newsSources, saveSiteImage, type NewsSource, type SiteImageUploadRefusal } from '@crystal-pharm/content-db';
import { fail, type ActionFailure } from '@sveltejs/kit';
import * as v from 'valibot';
import { readLayoutSettingsFormValues, toLayoutSettings } from '../../domain/layoutSettingsForm';
import { parseArticleDrafts, parseBrandDrafts, parseServiceDrafts, readSiteContentLists } from '../../domain/siteContentLists';
import { listModulesInDisplayOrder } from '../../domain/moduleOrder';
import { createEmptySectionDrafts, parseSectionDrafts, readSectionDrafts, toSectionDrafts } from '../../domain/siteSectionDrafts';
import { collectAvailableModuleData, toTenantSiteInput, type SiteEditorBase } from '../../domain/siteDraft';
import {
	articlesFieldName,
	brandsFieldName,
	moduleOrderFieldName,
	newsSourceFieldName,
	sectionsFieldName,
	servicesFieldName,
	uploadedImageFieldName,
	type SavedSiteEdition,
	type SiteEditionFailure,
	type SiteEditionSaved,
	type SiteEditorPageData,
	type SiteImageUploaded,
	type SiteImageUploadFailure
} from '../../pages/siteEditorPageData';
import { requireActiveTenantId } from '../activeTenant.server';
import { readPreviewFrame } from './previewFrame.server';
import { ensureSiteSubdomain, readPublicSiteUrlOfTenant } from '../site-address/siteAddress.server';
import { readSiteEditorSources, saveSiteEdition, type SiteEditorSources } from '../repositories/tenantSiteRepository.server';
import { toSiteEditorBase, toUploadedImagePreviewUrl } from './toSiteEditorBase.server';

type SiteEditorRequest = { locals: { user: AuthenticatedUser | null } };

export async function load({ locals }: SiteEditorRequest): Promise<SiteEditorPageData> {
	const tenantId = await requireActiveTenantId(locals.user);
	const sources = await readSiteEditorSources(tenantId);
	const base = toSiteEditorBase(tenantId, sources);
	return {
		isSiteCreated: sources.content !== undefined,
		publicSiteUrl: await readPublicSiteUrlOfTenant(tenantId),
		savedEdition: toSavedSiteEdition(sources, base),
		base,
		preview: readPreviewFrame()
	};
}

// Un premier site part du premier layout et montre tout ce qui a déjà des données.
function toSavedSiteEdition({ content }: SiteEditorSources, base: SiteEditorBase): SavedSiteEdition {
	if (content) {
		return {
			layoutId: content.layoutId,
			layoutSettingsByLayoutId: content.layoutSettingsByLayoutId,
			enabledModules: content.enabledModules,
			moduleOrder: listModulesInDisplayOrder(content.moduleOrder),
			sections: toSectionDrafts(content),
			services: content.services.map(({ icon, iconName, ...service }) => ({ ...service, iconName: iconName ?? '', ...(icon && { icon }) })),
			brands: content.brands.map(({ name, url, logo }) => ({ name, url: url ?? '', ...(logo && { logo }) })),
			articles: content.articles,
			newsSource: content.newsSource
		};
	}
	// Sans actualité à lui, un premier site montre celles de son groupement, s'il en a.
	const newsSource: NewsSource = base.group && base.group.articles.length > 0 ? 'group' : 'pharmacy';
	const sections = createEmptySectionDrafts();
	const availableModuleData = collectAvailableModuleData(base, { sections, services: [], brands: [], articles: [], newsSource });
	return {
		layoutId: layoutManifests[0]?.layoutId ?? '',
		layoutSettingsByLayoutId: {},
		enabledModules: ModuleNameSchema.options.filter((moduleName) => availableModuleData[moduleName] !== undefined),
		moduleOrder: listModulesInDisplayOrder([]),
		sections,
		services: [],
		brands: [],
		articles: [],
		newsSource
	};
}

export const actions = {
	save: async ({
		locals,
		request
	}: SiteEditorRequest & { request: Request }): Promise<SiteEditionSaved | ActionFailure<SiteEditionFailure>> => {
		const tenantId = await requireActiveTenantId(locals.user);
		const formData = await request.formData();
		const layoutId = String(formData.get('layoutId') ?? '');
		const enabledModules = readEnabledModules(formData);
		const moduleOrder = listModulesInDisplayOrder(readModuleOrder(formData));
		const sections = parseSectionDrafts(String(formData.get(sectionsFieldName) ?? 'null'));
		const services = parseServiceDrafts(String(formData.get(servicesFieldName) ?? '[]'));
		const brands = parseBrandDrafts(String(formData.get(brandsFieldName) ?? '[]'));
		const articles = parseArticleDrafts(String(formData.get(articlesFieldName) ?? '[]'));
		const newsSource = readNewsSource(formData);
		const manifest = findLayoutManifest(layoutId);
		const refuse = (submittedEdition: SiteEditionFailure['submittedEdition'], formError: string, fieldErrors = {}) =>
			fail(400, { submittedEdition, fieldErrors, formError });

		const emptySubmission = {
			layoutId,
			layoutSettingsFormValues: {},
			enabledModules,
			moduleOrder,
			sections: sections ?? createEmptySectionDrafts(),
			services: services ?? [],
			brands: brands ?? [],
			articles: articles ?? [],
			newsSource
		};
		if (!sections || !services || !brands || !articles) return refuse(emptySubmission, 'Le contenu envoyé est illisible.');
		if (!manifest) return refuse(emptySubmission, 'Choisissez une mise en page.');

		const layoutSettingsFormValues = readLayoutSettingsFormValues(manifest.settingsFields, formData);
		const submittedEdition = { ...emptySubmission, layoutSettingsFormValues };
		const layoutSettingsReading = toLayoutSettings(manifest, layoutSettingsFormValues);
		if (!layoutSettingsReading.success) {
			return fail(400, { submittedEdition, fieldErrors: layoutSettingsReading.fieldErrors, formError: layoutSettingsReading.formError });
		}
		const contentListsReading = readSiteContentLists(services, articles, brands);
		if (!contentListsReading.success) return refuse(submittedEdition, contentListsReading.formError);
		const sectionsReading = readSectionDrafts(sections);
		if (!sectionsReading.success) return refuse(submittedEdition, sectionsReading.formError);

		const base = toSiteEditorBase(tenantId, await readSiteEditorSources(tenantId));
		const draft = { layoutId, layoutSettings: layoutSettingsReading.layoutSettings, enabledModules, moduleOrder, sections, services, brands, articles, newsSource };
		const siteValidation = v.safeParse(TenantSiteSchema, toTenantSiteInput(base, draft));
		if (!siteValidation.success) return refuse(submittedEdition, siteValidation.issues[0].message);

		await saveSiteEdition(tenantId, {
			layoutId,
			layoutSettings: layoutSettingsReading.layoutSettings,
			enabledModules,
			moduleOrder,
			...sectionsReading.stored,
			services: contentListsReading.services,
			brands: contentListsReading.brands,
			articles: contentListsReading.articles,
			newsSource
		});
		await ensureSiteSubdomain(tenantId, base.pharmacy.name);
		return { isSaved: true };
	},

	uploadImage: async ({
		locals,
		request
	}: SiteEditorRequest & { request: Request }): Promise<SiteImageUploaded | ActionFailure<SiteImageUploadFailure>> => {
		const tenantId = await requireActiveTenantId(locals.user);
		const uploadedFile = (await request.formData()).get(uploadedImageFieldName);
		if (!(uploadedFile instanceof File)) return fail(400, { uploadRefusal: 'Choisissez une image.' });

		const saving = await saveSiteImage(tenantId, { contentType: uploadedFile.type, data: Buffer.from(await uploadedFile.arrayBuffer()) });
		if ('refusal' in saving) return fail(400, { uploadRefusal: uploadRefusalMessages[saving.refusal] });
		return { uploadedImage: { imageId: saving.imageId, previewUrl: toUploadedImagePreviewUrl(tenantId, saving.imageId) } };
	}
};

const uploadRefusalMessages: Record<SiteImageUploadRefusal, string> = {
	empty: 'Ce fichier est vide.',
	unsupportedType: 'Envoyez une image PNG, JPEG ou WebP.',
	tooLarge: 'Cette image est trop lourde (2 Mo au maximum).'
};

function readModuleOrder(formData: FormData): ModuleName[] {
	return readModuleNames(formData, moduleOrderFieldName);
}

function readEnabledModules(formData: FormData): ModuleName[] {
	return readModuleNames(formData, 'enabledModules');
}

function readModuleNames(formData: FormData, fieldName: string): ModuleName[] {
	return formData.getAll(fieldName).filter((moduleName) => v.is(ModuleNameSchema, moduleName));
}

function readNewsSource(formData: FormData): NewsSource {
	const submittedNewsSource = formData.get(newsSourceFieldName);
	return v.is(v.picklist(newsSources), submittedNewsSource) ? submittedNewsSource : 'pharmacy';
}

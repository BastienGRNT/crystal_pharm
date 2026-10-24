import type { AuthenticatedUser } from '@crystal-pharm/auth';
import { findLayoutManifest, layoutManifests } from '@crystal-pharm/layouts/manifest';
import { ModuleNameSchema, TenantSiteSchema, type ModuleName } from '@crystal-pharm/schema';
import { newsSources, type NewsSource } from '@crystal-pharm/content-db';
import { fail, type ActionFailure } from '@sveltejs/kit';
import * as v from 'valibot';
import { readLayoutSettingsFormValues, toLayoutSettings } from '../domain/layoutSettingsForm';
import { parseArticleDrafts, parseServiceDrafts, readSiteContentLists } from '../domain/siteContentLists';
import { collectAvailableModuleData, toTenantSiteInput, type SiteEditorBase } from '../domain/siteDraft';
import {
	articlesFieldName,
	newsSourceFieldName,
	servicesFieldName,
	type SavedSiteEdition,
	type SiteEditionFailure,
	type SiteEditionSaved,
	type SiteEditorPageData
} from '../pages/siteEditorPageData';
import { requireActiveTenantId } from './activeTenant.server';
import { readPreviewFrame } from './previewFrame.server';
import { readPublicSiteUrl } from './publicSiteUrl.server';
import { readSiteEditorSources, saveSiteEdition, type SiteEditorSources } from './repositories/tenantSiteRepository.server';
import { toSiteEditorBase } from './toSiteEditorBase.server';

type SiteEditorRequest = { locals: { user: AuthenticatedUser | null } };

export async function load({ locals }: SiteEditorRequest): Promise<SiteEditorPageData> {
	const tenantId = await requireActiveTenantId(locals.user);
	const sources = await readSiteEditorSources(tenantId);
	const base = toSiteEditorBase(tenantId, sources);
	return {
		isSiteCreated: sources.content !== undefined,
		publicSiteUrl: readPublicSiteUrl(tenantId),
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
			services: content.services.map((service) => ({ ...service, iconName: service.iconName ?? '' })),
			articles: content.articles.map(({ title, summary, publishedAt }) => ({ title, summary, publishedAt })),
			newsSource: content.newsSource
		};
	}
	// Sans actualité à lui, un premier site montre celles de son groupement, s'il en a.
	const newsSource: NewsSource = base.group && base.group.articles.length > 0 ? 'group' : 'pharmacy';
	const availableModuleData = collectAvailableModuleData(base, { services: [], articles: [], newsSource });
	return {
		layoutId: layoutManifests[0]?.layoutId ?? '',
		layoutSettingsByLayoutId: {},
		enabledModules: ModuleNameSchema.options.filter((moduleName) => availableModuleData[moduleName] !== undefined),
		services: [],
		articles: [],
		newsSource
	};
}

export const actions = {
	default: async ({
		locals,
		request
	}: SiteEditorRequest & { request: Request }): Promise<SiteEditionSaved | ActionFailure<SiteEditionFailure>> => {
		const tenantId = await requireActiveTenantId(locals.user);
		const formData = await request.formData();
		const layoutId = String(formData.get('layoutId') ?? '');
		const enabledModules = readEnabledModules(formData);
		const services = parseServiceDrafts(String(formData.get(servicesFieldName) ?? '[]'));
		const articles = parseArticleDrafts(String(formData.get(articlesFieldName) ?? '[]'));
		const newsSource = readNewsSource(formData);
		const manifest = findLayoutManifest(layoutId);
		const refuse = (submittedEdition: SiteEditionFailure['submittedEdition'], formError: string, fieldErrors = {}) =>
			fail(400, { submittedEdition, fieldErrors, formError });

		const emptySubmission = { layoutId, layoutSettingsFormValues: {}, enabledModules, services: services ?? [], articles: articles ?? [], newsSource };
		if (!services || !articles) return refuse(emptySubmission, 'Les services ou les actualités envoyés sont illisibles.');
		if (!manifest) return refuse(emptySubmission, 'Choisissez une mise en page.');

		const layoutSettingsFormValues = readLayoutSettingsFormValues(manifest.settingsFields, formData);
		const submittedEdition = { ...emptySubmission, layoutSettingsFormValues };
		const layoutSettingsReading = toLayoutSettings(manifest, layoutSettingsFormValues);
		if (!layoutSettingsReading.success) {
			return fail(400, { submittedEdition, fieldErrors: layoutSettingsReading.fieldErrors, formError: layoutSettingsReading.formError });
		}
		const contentListsReading = readSiteContentLists(services, articles);
		if (!contentListsReading.success) return refuse(submittedEdition, contentListsReading.formError);

		const base = toSiteEditorBase(tenantId, await readSiteEditorSources(tenantId));
		const draft = { layoutId, layoutSettings: layoutSettingsReading.layoutSettings, enabledModules, services, articles, newsSource };
		const siteValidation = v.safeParse(TenantSiteSchema, toTenantSiteInput(base, draft));
		if (!siteValidation.success) return refuse(submittedEdition, siteValidation.issues[0].message);

		await saveSiteEdition(tenantId, {
			layoutId,
			layoutSettings: layoutSettingsReading.layoutSettings,
			enabledModules,
			services: contentListsReading.services,
			articles: contentListsReading.articles,
			newsSource
		});
		return { isSaved: true };
	}
};

function readEnabledModules(formData: FormData): ModuleName[] {
	return formData.getAll('enabledModules').filter((moduleName) => v.is(ModuleNameSchema, moduleName));
}

function readNewsSource(formData: FormData): NewsSource {
	const submittedNewsSource = formData.get(newsSourceFieldName);
	return v.is(v.picklist(newsSources), submittedNewsSource) ? submittedNewsSource : 'pharmacy';
}

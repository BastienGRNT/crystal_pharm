import type { NewsSource } from '@crystal-pharm/group-db/domain';
import type { ModuleName } from '@crystal-pharm/schema';
import type { LayoutSettingsFormValues } from '../domain/layoutSettingsForm';
import type { ArticleDraft, ServiceDraft } from '../domain/siteContentLists';
import type { SiteEditorBase } from '../domain/siteDraft';

/** Ce qui est enregistré, ou ce qu'on propose tant que le site n'existe pas. */
export type SavedSiteEdition = {
	layoutId: string;
	layoutSettingsByLayoutId: Record<string, Record<string, unknown>>;
	enabledModules: ModuleName[];
	services: ServiceDraft[];
	articles: ArticleDraft[];
	newsSource: NewsSource;
};

export type SiteEditorPageData = {
	isSiteCreated: boolean;
	/** Là où les Visitors voient le site, une fois enregistré. */
	publicSiteUrl: string;
	savedEdition: SavedSiteEdition;
	base: SiteEditorBase;
	preview: { frameUrl: string; frameOrigin: string };
};

/** Renvoyé quand l'enregistrement est refusé : le formulaire se remplit avec ce qui a été envoyé. */
export type SiteEditionFailure = {
	submittedEdition: {
		layoutId: string;
		layoutSettingsFormValues: LayoutSettingsFormValues;
		enabledModules: ModuleName[];
		services: ServiceDraft[];
		articles: ArticleDraft[];
		newsSource: NewsSource;
	};
	fieldErrors: Record<string, string>;
	formError: string | undefined;
};

export type SiteEditionSaved = { isSaved: true };

/** Les champs cachés qui portent les listes saisies dans l'éditeur. */
export const servicesFieldName = 'servicesJson';
export const articlesFieldName = 'articlesJson';
export const newsSourceFieldName = 'newsSource';

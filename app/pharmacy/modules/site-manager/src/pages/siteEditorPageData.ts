import type { NewsSource } from '@crystal-pharm/group-db/domain';
import type { ModuleName } from '@crystal-pharm/schema';
import type { LayoutSettingsFormValues } from '../domain/layoutSettingsForm';
import type { ArticleDraft, BrandDraft, ServiceDraft } from '../domain/siteContentLists';
import type { SectionDrafts } from '../domain/siteSectionDrafts';
import type { SiteEditorBase } from '../domain/siteDraft';

/** Ce qui est enregistré, ou ce qu'on propose tant que le site n'existe pas. */
export type SavedSiteEdition = {
	layoutId: string;
	layoutSettingsByLayoutId: Record<string, Record<string, unknown>>;
	enabledModules: ModuleName[];
	/** L'ordre complet des modules, celui du site. */
	moduleOrder: ModuleName[];
	sections: SectionDrafts;
	services: ServiceDraft[];
	brands: BrandDraft[];
	articles: ArticleDraft[];
	newsSource: NewsSource;
};

export type SiteEditorPageData = {
	isSiteCreated: boolean;
	/** Là où les Visitors voient le site ; `undefined` tant qu'il n'a pas d'adresse (avant le premier enregistrement). */
	publicSiteUrl: string | undefined;
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
		moduleOrder: ModuleName[];
		sections: SectionDrafts;
		services: ServiceDraft[];
		brands: BrandDraft[];
		articles: ArticleDraft[];
		newsSource: NewsSource;
	};
	fieldErrors: Record<string, string>;
	formError: string | undefined;
};

export type SiteEditionSaved = { isSaved: true };

/** Renvoyé à l'envoi d'une image : de quoi l'afficher dans l'aperçu avant même d'enregistrer le site. */
export type SiteImageUploaded = { uploadedImage: { imageId: string; previewUrl: string } };
export type SiteImageUploadFailure = { uploadRefusal: string };

export const uploadImageActionPathname = '?/uploadImage';
export const uploadedImageFieldName = 'image';

export const siteAddressPathname = '/site-manager/adresse';

/** Les champs cachés qui portent les listes saisies dans l'éditeur. */
export const servicesFieldName = 'servicesJson';
export const articlesFieldName = 'articlesJson';
export const brandsFieldName = 'brandsJson';
export const sectionsFieldName = 'sectionsJson';
export const moduleOrderFieldName = 'moduleOrder';
export const newsSourceFieldName = 'newsSource';

import {
	listUploadedImageIds,
	renderSiteImageSuggestion,
	resolveSiteImageUrl,
	type EditedSiteContent,
	type SiteImage,
	type SiteImageSlot,
	type SiteImageUrlResolver
} from '@crystal-pharm/content-db/domain';
import { findLayoutDefaultImageUrl, findLayoutImageUrl } from '@crystal-pharm/layouts/manifest';

/**
 * Les adresses de l'aperçu : une suggestion est dessinée sur place, une image envoyée passe par un jeton signé.
 * L'aperçu est une iframe d'un autre domaine : une image du layout y est demandée à l'adresse complète de cette app.
 */
export function createPreviewImageResolver(layoutId: string, uploadedImagePreviewUrls: Record<string, string>): SiteImageUrlResolver {
	return {
		toLayoutImageUrl: (slot, imageKey) => toAbsoluteUrl(findLayoutImageUrl(layoutId, slot, imageKey)),
		toDefaultImageUrl: (slot) => toAbsoluteUrl(findLayoutDefaultImageUrl(layoutId, slot)),
		toSuggestionUrl: (suggestionKey) => `data:image/svg+xml,${encodeURIComponent(renderSiteImageSuggestion(suggestionKey))}`,
		toUploadUrl: (imageId) => uploadedImagePreviewUrls[imageId] ?? ''
	};
}

function toAbsoluteUrl(url: string | undefined): string | undefined {
	return url && typeof location !== 'undefined' ? new URL(url, location.origin).href : url;
}

export function toPreviewImageUrl(
	image: SiteImage | undefined,
	slot: SiteImageSlot,
	layoutId: string,
	uploadedImagePreviewUrls: Record<string, string>
): string | undefined {
	return resolveSiteImageUrl(image, createPreviewImageResolver(layoutId, uploadedImagePreviewUrls), slot);
}

/** Une proposition du layout (`layout`) comme une ancienne suggestion de la plateforme se choisissent dans « Propositions ». */
export type ImageChoiceKind = 'default' | 'suggestion' | 'upload' | 'link';

export function toImageChoiceKind(image: SiteImage | undefined): ImageChoiceKind {
	if (!image) return 'default';
	return image.kind === 'layout' ? 'suggestion' : image.kind;
}

/** Toutes les images envoyées que le contenu utilise ; les autres envois ne servent plus. */
export function listUploadedImageIdsOfContent(content: Pick<EditedSiteContent, 'hero' | 'services' | 'brands' | 'articles'>): string[] {
	return listUploadedImageIds([
		content.hero?.image,
		...content.services.map((service) => service.icon),
		...content.brands.map((brand) => brand.logo),
		...content.articles.map((article) => article.image)
	]);
}

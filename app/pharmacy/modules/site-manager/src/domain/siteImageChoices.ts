import {
	listUploadedImageIds,
	renderSiteImageSuggestion,
	resolveSiteImageUrl,
	type EditedSiteContent,
	type SiteImage,
	type SiteImageUrlResolver
} from '@crystal-pharm/content-db/domain';

/** Les adresses de l'aperçu : une suggestion est dessinée sur place, une image envoyée passe par un jeton signé. */
export function createPreviewImageResolver(uploadedImagePreviewUrls: Record<string, string>): SiteImageUrlResolver {
	return {
		toSuggestionUrl: (suggestionKey) => `data:image/svg+xml,${encodeURIComponent(renderSiteImageSuggestion(suggestionKey))}`,
		toUploadUrl: (imageId) => uploadedImagePreviewUrls[imageId] ?? ''
	};
}

export function toPreviewImageUrl(image: SiteImage | undefined, uploadedImagePreviewUrls: Record<string, string>): string | undefined {
	return resolveSiteImageUrl(image, createPreviewImageResolver(uploadedImagePreviewUrls));
}

export type ImageChoiceKind = 'default' | SiteImage['kind'];

export function toImageChoiceKind(image: SiteImage | undefined): ImageChoiceKind {
	return image?.kind ?? 'default';
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

import * as v from 'valibot';

/** Les illustrations proposées par la plateforme : le Tenant en choisit une plutôt que d'envoyer la sienne. */
export const siteImageSuggestions = [
	{ key: 'green-meadow', label: 'Prairie', colors: ['#d8efe0', '#7cc4a0'] },
	{ key: 'blue-morning', label: 'Matin bleu', colors: ['#dcecf8', '#7fb2dc'] },
	{ key: 'warm-sand', label: 'Sable chaud', colors: ['#f7eadb', '#e0b98a'] },
	{ key: 'soft-lavender', label: 'Lavande', colors: ['#ece4f6', '#a995d3'] }
] as const;

export type SiteImageSuggestionKey = (typeof siteImageSuggestions)[number]['key'];

const suggestionKeys = siteImageSuggestions.map((suggestion) => suggestion.key);

/** Une image du site : une suggestion de la plateforme, un lien ou un fichier envoyé par le Tenant. */
export const SiteImageSchema = v.variant('kind', [
	v.object({ kind: v.literal('suggestion'), suggestionKey: v.picklist(suggestionKeys) }),
	v.object({ kind: v.literal('link'), url: v.pipe(v.string(), v.url(), v.maxLength(2000)) }),
	v.object({ kind: v.literal('upload'), imageId: v.pipe(v.string(), v.uuid()) })
]);

export type SiteImage = v.InferOutput<typeof SiteImageSchema>;

/** Comment le domaine qui affiche le site atteint une image de la plateforme ou envoyée. */
export type SiteImageUrlResolver = {
	toSuggestionUrl: (suggestionKey: SiteImageSuggestionKey) => string;
	toUploadUrl: (imageId: string) => string;
};

export function resolveSiteImageUrl(image: SiteImage | undefined, resolver: SiteImageUrlResolver): string | undefined {
	if (!image) return undefined;
	if (image.kind === 'link') return image.url;
	if (image.kind === 'suggestion') return resolver.toSuggestionUrl(image.suggestionKey);
	return resolver.toUploadUrl(image.imageId);
}

export function listUploadedImageIds(images: ReadonlyArray<SiteImage | undefined>): string[] {
	return images.flatMap((image) => (image?.kind === 'upload' ? [image.imageId] : []));
}

export function renderSiteImageSuggestion(suggestionKey: SiteImageSuggestionKey): string {
	const suggestion = siteImageSuggestions.find((candidate) => candidate.key === suggestionKey);
	const [lightColor, deepColor] = suggestion?.colors ?? siteImageSuggestions[0].colors;
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${lightColor}"/><stop offset="1" stop-color="${deepColor}"/></linearGradient></defs><rect width="1600" height="900" fill="url(#g)"/><circle cx="1280" cy="220" r="260" fill="#ffffff" fill-opacity="0.35"/><circle cx="260" cy="760" r="340" fill="#ffffff" fill-opacity="0.22"/></svg>`;
}

export function isSiteImageSuggestionKey(value: string): value is SiteImageSuggestionKey {
	return (suggestionKeys as string[]).includes(value);
}

export const maximumUploadedImageBytes = 2 * 1024 * 1024;
export const acceptedUploadedImageTypes = ['image/png', 'image/jpeg', 'image/webp'] as const;

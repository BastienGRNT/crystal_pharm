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

/** Où une image se pose : chaque layout déclare un défaut et des propositions pour chacun de ces emplacements. */
export const siteImageSlots = ['hero', 'service', 'brand', 'article'] as const;

export type SiteImageSlot = (typeof siteImageSlots)[number];

/** Une image du site : une proposition de son layout, une suggestion historique de la plateforme, un lien ou un fichier envoyé par le Tenant. */
export const SiteImageSchema = v.variant('kind', [
	v.object({ kind: v.literal('layout'), imageKey: v.pipe(v.string(), v.regex(/^[a-z0-9-]+$/), v.maxLength(64)) }),
	v.object({ kind: v.literal('suggestion'), suggestionKey: v.picklist(suggestionKeys) }),
	v.object({ kind: v.literal('link'), url: v.pipe(v.string(), v.url(), v.maxLength(2000)) }),
	v.object({ kind: v.literal('upload'), imageId: v.pipe(v.string(), v.uuid()) })
]);

export type SiteImage = v.InferOutput<typeof SiteImageSchema>;

/** Comment le domaine qui affiche le site atteint une image de la plateforme ou envoyée. */
export type SiteImageUrlResolver = {
	/** L'image qu'un layout propose sous cette clé ; liée au layout du site affiché. */
	toLayoutImageUrl: (slot: SiteImageSlot, imageKey: string) => string | undefined;
	/** L'image que le layout montre quand le Tenant n'en choisit pas ; absente si le layout n'en déclare pas. */
	toDefaultImageUrl: (slot: SiteImageSlot) => string | undefined;
	toSuggestionUrl: (suggestionKey: SiteImageSuggestionKey) => string;
	toUploadUrl: (imageId: string) => string;
};

export function resolveSiteImageUrl(image: SiteImage | undefined, resolver: SiteImageUrlResolver, slot: SiteImageSlot): string | undefined {
	if (!image) return resolver.toDefaultImageUrl(slot);
	if (image.kind === 'layout') return resolver.toLayoutImageUrl(slot, image.imageKey) ?? resolver.toDefaultImageUrl(slot);
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

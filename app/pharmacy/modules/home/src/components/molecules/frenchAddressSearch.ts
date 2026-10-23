import * as v from 'valibot';

// Le géocodeur national (IGN, Géoplateforme), qui a remplacé
// api-adresse.data.gouv.fr : gratuit, sans clé, appelable depuis le navigateur.
const addressSearchUrl = 'https://data.geopf.fr/geocodage/search';
const maximumSuggestionCount = 5;

export type FrenchAddress = { street: string; postalCode: string; city: string };

export type FrenchAddressSuggestion = FrenchAddress & { key: string };

// Une commune seule n'a pas de rue : on ne garde que ce qui peut remplir le champ « Adresse ».
const AddressFeatureSchema = v.object({
	properties: v.object({
		id: v.string(),
		type: v.picklist(['housenumber', 'street', 'locality']),
		name: v.string(),
		postcode: v.string(),
		city: v.string()
	})
});

const AddressSearchResponseSchema = v.object({ features: v.array(v.unknown()) });

export async function searchFrenchAddresses(
	typedAddress: string,
	abortSignal: AbortSignal
): Promise<FrenchAddressSuggestion[]> {
	const searchUrl = new URL(addressSearchUrl);
	searchUrl.search = new URLSearchParams({
		q: typedAddress,
		index: 'address',
		autocomplete: '1',
		limit: String(maximumSuggestionCount)
	}).toString();

	const response = await fetch(searchUrl, { signal: abortSignal });
	if (!response.ok) return [];

	const searchResponse = v.safeParse(AddressSearchResponseSchema, await response.json());
	if (!searchResponse.success) return [];

	return searchResponse.output.features
		.filter((feature) => v.is(AddressFeatureSchema, feature))
		.map(({ properties }) => ({
			key: properties.id,
			street: properties.name,
			postalCode: properties.postcode,
			city: properties.city
		}));
}

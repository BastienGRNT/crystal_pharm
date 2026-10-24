import * as v from 'valibot';
import { PharmacyGroupNameSchema } from '../pharmacyGroupDetails';

const maximumLoyaltyCardUrlLength = 500;
export const maximumLoyaltyCardMessageLength = 160;

const OptionalTextSchema = v.pipe(v.string(), v.trim(), v.transform((text) => text || undefined));

// Un lien tapé sans `https://` (« www.ma-carte.fr ») est complété : personne ne
// le tape, et un navigateur ne l'ouvrirait pas sans.
const LoyaltyCardUrlSchema = v.pipe(
	OptionalTextSchema,
	v.transform((url) => (url === undefined || /^https?:\/\//i.test(url) ? url : `https://${url}`)),
	v.check((url) => url === undefined || isWebAddress(url), 'Ce lien n’est pas une adresse web valide.'),
	v.check(
		(url) => url === undefined || url.length <= maximumLoyaltyCardUrlLength,
		`${maximumLoyaltyCardUrlLength} caractères au plus.`
	)
);

const LoyaltyCardMessageSchema = v.pipe(
	OptionalTextSchema,
	v.check(
		(message) => message === undefined || message.length <= maximumLoyaltyCardMessageLength,
		`${maximumLoyaltyCardMessageLength} caractères au plus.`
	)
);

/** Ce qu'un GroupMember saisit de la fiche de son groupement ; tout ce qui touche à la carte de fidélité est facultatif. */
export const PharmacyGroupProfileSchema = v.object({
	name: PharmacyGroupNameSchema,
	loyaltyCardUrl: LoyaltyCardUrlSchema,
	loyaltyCardMessage: LoyaltyCardMessageSchema
});

export type PharmacyGroupProfileInput = v.InferInput<typeof PharmacyGroupProfileSchema>;
export type PharmacyGroupProfileTexts = v.InferOutput<typeof PharmacyGroupProfileSchema>;

export const pharmacyGroupProfileTextFieldNames = ['name', 'loyaltyCardUrl', 'loyaltyCardMessage'] as const satisfies ReadonlyArray<
	keyof PharmacyGroupProfileInput
>;

/** Les images de la fiche : le nom de leur champ de fichier, et celui envoyé à `true` quand l'image actuelle est retirée. */
export const pharmacyGroupImageFields = {
	logo: { fieldName: 'logo', removalFieldName: 'removeLogo', label: 'Le logo' },
	loyaltyCardImage: { fieldName: 'loyaltyCardImage', removalFieldName: 'removeLoyaltyCardImage', label: 'L’image de la carte' }
} as const;

export type PharmacyGroupImageKind = keyof typeof pharmacyGroupImageFields;

export type PharmacyGroupProfileFieldName = keyof PharmacyGroupProfileInput | PharmacyGroupImageKind;

/** Un fichier choisi remplace l'image ; sans fichier, elle reste, sauf si elle a été retirée. */
export type PharmacyGroupImageChange = { kind: 'replaced'; upload: Blob } | { kind: 'removed' } | { kind: 'unchanged' };

export type PharmacyGroupImageChanges = Record<PharmacyGroupImageKind, PharmacyGroupImageChange>;

function isWebAddress(text: string): boolean {
	try {
		const url = new URL(text);
		return (url.protocol === 'https:' || url.protocol === 'http:') && url.hostname.includes('.');
	} catch {
		return false;
	}
}

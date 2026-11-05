import * as v from 'valibot';
import { PhoneNumberSchema } from './PhoneNumber';
import { SiretSchema } from './Siret';

const maximumTextLength = 200;

function requiredText(missingMessage: string) {
	return v.pipe(
		v.string(),
		v.trim(),
		v.nonEmpty(missingMessage),
		v.maxLength(maximumTextLength, `${maximumTextLength} caractères au plus.`)
	);
}

const EmailSchema = v.pipe(v.string(), v.email());

const RequiredEmailSchema = v.pipe(
	v.string(),
	v.trim(),
	v.nonEmpty('Indiquez l’email de contact de la pharmacie.'),
	v.check((email) => v.is(EmailSchema, email), 'Cet email n’est pas valide. Vérifiez son orthographe.')
);

/** Les coordonnées de la pharmacie : ce que son site affiche, ce qui la situe et, pour ses factures, son SIRET. */
export const PharmacyContactDetailsSchema = v.object({
	name: requiredText('Indiquez le nom de la pharmacie.'),
	street: requiredText('Indiquez le numéro et la rue.'),
	postalCode: v.pipe(v.string(), v.trim(), v.regex(/^\d{5}$/, 'Le code postal compte 5 chiffres.')),
	city: requiredText('Indiquez la ville.'),
	phoneNumber: PhoneNumberSchema,
	email: RequiredEmailSchema,
	siret: SiretSchema
});

/** Ce qu'on saisit : du texte, tel qu'il a été tapé. */
export type PharmacyContactDetailsInput = v.InferInput<typeof PharmacyContactDetailsSchema>;
export type PharmacyContactDetails = v.InferOutput<typeof PharmacyContactDetailsSchema>;
export type PharmacyContactDetailsFieldName = keyof PharmacyContactDetailsInput;

export const pharmacyContactDetailsFieldNames = Object.keys(
	PharmacyContactDetailsSchema.entries
) as PharmacyContactDetailsFieldName[];

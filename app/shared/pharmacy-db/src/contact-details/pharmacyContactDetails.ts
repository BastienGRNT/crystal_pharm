import * as v from 'valibot';
import { PhoneNumberSchema } from './PhoneNumber';

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

const OptionalEmailSchema = v.pipe(
	v.string(),
	v.trim(),
	v.check((email) => email === '' || v.is(EmailSchema, email), 'Cet email n’est pas valide. Vérifiez son orthographe.'),
	v.transform((email) => email || undefined)
);

/** Les coordonnées de la pharmacie : ce que son site affiche et ce qui la situe. */
export const PharmacyContactDetailsSchema = v.object({
	name: requiredText('Indiquez le nom de la pharmacie.'),
	street: requiredText('Indiquez le numéro et la rue.'),
	postalCode: v.pipe(v.string(), v.trim(), v.regex(/^\d{5}$/, 'Le code postal compte 5 chiffres.')),
	city: requiredText('Indiquez la ville.'),
	phoneNumber: PhoneNumberSchema,
	email: OptionalEmailSchema
});

/** Ce qu'on saisit : du texte, tel qu'il a été tapé. */
export type PharmacyContactDetailsInput = v.InferInput<typeof PharmacyContactDetailsSchema>;
export type PharmacyContactDetails = v.InferOutput<typeof PharmacyContactDetailsSchema>;
export type PharmacyContactDetailsFieldName = keyof PharmacyContactDetailsInput;

export const pharmacyContactDetailsFieldNames = Object.keys(
	PharmacyContactDetailsSchema.entries
) as PharmacyContactDetailsFieldName[];

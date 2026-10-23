import * as v from 'valibot';

const maximumPharmacyQuota = 10_000;

const OptionalEmailSchema = v.pipe(
	v.string(),
	v.trim(),
	v.toLowerCase(),
	v.check((email) => email === '' || v.is(v.pipe(v.string(), v.email()), email), 'Cet email n’est pas valide.'),
	v.transform((email) => email || undefined)
);

/** Ce que la Platform saisit d'un groupement. */
export const PharmacyGroupDetailsSchema = v.object({
	name: v.pipe(v.string(), v.trim(), v.nonEmpty('Indiquez le nom du groupement.'), v.maxLength(200, '200 caractères au plus.')),
	contactEmail: OptionalEmailSchema,
	pharmacyQuota: v.pipe(
		v.union([v.string(), v.number()]),
		v.transform(Number),
		v.integer('Indiquez un nombre entier de pharmacies.'),
		v.minValue(1, 'Au moins une pharmacie.'),
		v.maxValue(maximumPharmacyQuota, `${maximumPharmacyQuota} pharmacies au plus.`)
	)
});

export type PharmacyGroupDetailsInput = v.InferInput<typeof PharmacyGroupDetailsSchema>;
export type PharmacyGroupDetails = v.InferOutput<typeof PharmacyGroupDetailsSchema>;
export type PharmacyGroupDetailsFieldName = keyof PharmacyGroupDetailsInput;

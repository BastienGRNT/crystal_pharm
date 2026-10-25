import * as v from 'valibot';

const tenMegabytes = 10 * 1024 * 1024;

const documentMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'] as const;

const requiredText = (message: string) => v.pipe(v.string(), v.trim(), v.nonEmpty(message));

function documentFile(missingMessage: string) {
  return v.pipe(
    v.file(missingMessage),
    v.mimeType(documentMimeTypes, 'Formats acceptés : photo (JPEG, PNG, WebP, HEIC) ou PDF.'),
    v.maxSize(tenMegabytes, 'Le fichier ne doit pas dépasser 10 Mo.'),
  );
}

/** Un champ facultatif : absent, `undefined` ou texte vide veulent tous dire « non renseigné ». */
function optionalDocumentFile() {
  return v.optional(documentFile('Le fichier est invalide.'));
}

function isRealPastDate(isoDate: string): boolean {
  const date = new Date(`${isoDate}T00:00:00Z`);
  const isRealDate = !Number.isNaN(date.getTime()) && date.toISOString().startsWith(isoDate);
  return isRealDate && date.getTime() <= Date.now() && date.getUTCFullYear() >= 1900;
}

/** Les 13 chiffres du numéro, la Corse (2A, 2B) comptant pour 19 et 18, puis la clé de contrôle sur 97. */
export function isValidSocialSecurityNumber(socialSecurityNumber: string): boolean {
  if (!/^[1-8]\d{4}(?:\d{2}|2[AB])\d{6}\d{2}$/.test(socialSecurityNumber)) return false;
  const numberWithoutKey = socialSecurityNumber.slice(0, 13).replace('2A', '19').replace('2B', '18');
  const expectedKey = 97 - (Number(numberWithoutKey) % 97);
  return expectedKey === Number(socialSecurityNumber.slice(13));
}

const socialSecurityNumberSchema = v.pipe(
  v.string(),
  v.transform((rawValue) => rawValue.replace(/\s/g, '').toUpperCase()),
  v.transform((withoutSpaces) => (withoutSpaces === '' ? undefined : withoutSpaces)),
  v.check(
    (socialSecurityNumber) => socialSecurityNumber === undefined || isValidSocialSecurityNumber(socialSecurityNumber),
    'Ce numéro de sécurité sociale ne semble pas valide : vérifiez les 15 chiffres.',
  ),
);

const checkboxSchema = v.pipe(
  v.union([v.boolean(), v.picklist(['true', 'false'])]),
  v.transform((value) => value === true || value === 'true'),
);

/**
 * Ce que le formulaire d'ordonnance envoie à l'API, validé à l'identique dans le navigateur et sur le serveur.
 * La carte Vitale (photo ou numéro) et la mutuelle sont facultatives : elles font gagner du temps au comptoir.
 * Un client déjà venu ne les envoie pas (la pharmacie les a) : l'API les ignore s'ils arrivent quand même.
 */
export const PrescriptionUploadRequestSchema = v.object({
  firstName: requiredText('Indiquez votre prénom.'),
  lastName: requiredText('Indiquez votre nom.'),
  birthDate: v.pipe(
    v.string('Indiquez votre date de naissance.'),
    v.regex(/^\d{4}-\d{2}-\d{2}$/, 'Indiquez votre date de naissance.'),
    v.check(isRealPastDate, 'Cette date de naissance ne semble pas valide.'),
  ),
  phone: v.pipe(
    v.string(),
    v.trim(),
    v.regex(/^(?:\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}$/, 'Indiquez un numéro de téléphone valide, par exemple 06 12 34 56 78.'),
  ),
  /** Date et heure locales de la pharmacie, `2026-03-14T17:30`. */
  plannedVisitAt: v.pipe(
    v.string('Indiquez quand vous comptez passer.'),
    v.regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Indiquez quand vous comptez passer.'),
  ),
  hasAlreadyVisited: checkboxSchema,
  prescriptionFile: documentFile('Ajoutez une photo ou un PDF de votre ordonnance.'),
  socialSecurityNumber: v.optional(socialSecurityNumberSchema),
  vitalCardPhoto: optionalDocumentFile(),
  mutualCardFront: optionalDocumentFile(),
  mutualCardBack: optionalDocumentFile(),
});

export type PrescriptionUploadRequest = v.InferOutput<typeof PrescriptionUploadRequestSchema>;

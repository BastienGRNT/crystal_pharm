import * as v from 'valibot';

const tenMegabytes = 10 * 1024 * 1024;

/** Ce que le formulaire d'ordonnance envoie à l'API, validé à l'identique dans le navigateur et sur le serveur. */
export const PrescriptionUploadRequestSchema = v.object({
  tenantId: v.pipe(v.string(), v.nonEmpty()),
  firstName: v.pipe(v.string(), v.trim(), v.nonEmpty('Indiquez votre prénom.')),
  lastName: v.pipe(v.string(), v.trim(), v.nonEmpty('Indiquez votre nom.')),
  phone: v.pipe(
    v.string(),
    v.trim(),
    v.regex(/^(?:\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}$/, 'Indiquez un numéro de téléphone valide, par exemple 06 12 34 56 78.'),
  ),
  file: v.pipe(
    v.file('Ajoutez une photo ou un PDF de votre ordonnance.'),
    v.mimeType(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'], 'Formats acceptés : photo (JPEG, PNG, WebP, HEIC) ou PDF.'),
    v.maxSize(tenMegabytes, 'Le fichier ne doit pas dépasser 10 Mo.'),
  ),
});

export type PrescriptionUploadRequest = v.InferOutput<typeof PrescriptionUploadRequestSchema>;

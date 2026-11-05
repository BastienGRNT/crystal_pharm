import * as v from 'valibot';

export const prescriptionDocumentKinds = ['prescription', 'vitalCard', 'mutualCardFront', 'mutualCardBack'] as const;
export const maximumAnnouncedDocumentCount = 7;
const maximumDocumentSizeInBytes = 10 * 1024 * 1024;

const OptionalTextSchema = (maximumLength: number) => v.optional(v.pipe(v.string(), v.maxLength(maximumLength)));

/** Ce que le navigateur annonce d'un envoi : les champs, et la nature, la taille et le type de chaque fichier, jamais le fichier. */
export const PrescriptionUploadStartSchema = v.object({
  firstName: OptionalTextSchema(200),
  lastName: OptionalTextSchema(200),
  birthDate: OptionalTextSchema(20),
  phone: OptionalTextSchema(40),
  email: OptionalTextSchema(320),
  plannedVisitAt: OptionalTextSchema(40),
  hasAlreadyVisited: v.boolean(),
  isRenewal: v.boolean(),
  noteFromPatient: OptionalTextSchema(2000),
  socialSecurityNumber: OptionalTextSchema(40),
  documents: v.pipe(
    v.array(
      v.object({
        kind: v.picklist(prescriptionDocumentKinds),
        sizeInBytes: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(maximumDocumentSizeInBytes)),
        contentType: v.pipe(v.string(), v.maxLength(100)),
      }),
    ),
    v.minLength(1),
    v.maxLength(maximumAnnouncedDocumentCount),
  ),
});

export type PrescriptionUploadStart = v.InferOutput<typeof PrescriptionUploadStartSchema>;

const UploadUrlSchema = v.pipe(
  v.string(),
  v.url(),
  v.check((url) => /^https?:\/\//.test(url)),
);

/** Un lien de dépôt pré-signé : le fichier n'y passe que par le navigateur, jamais par ce serveur. */
export const DocumentUploadLinkSchema = v.object({
  position: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(maximumAnnouncedDocumentCount - 1)),
  url: UploadUrlSchema,
  requiredHeaders: v.record(v.pipe(v.string(), v.maxLength(100)), v.pipe(v.string(), v.maxLength(500))),
});

export type DocumentUploadLink = v.InferOutput<typeof DocumentUploadLinkSchema>;

export const PrescriptionUploadStartResultSchema = v.object({
  alreadyReceived: v.boolean(),
  uploadLinks: v.array(DocumentUploadLinkSchema),
});

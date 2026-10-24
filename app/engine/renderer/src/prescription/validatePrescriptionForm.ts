import { PrescriptionUploadRequestSchema, type PrescriptionUploadRequest } from '@crystal-pharm/schema';
import * as v from 'valibot';

/** Ce que le formulaire du layout doit fournir. */
export type PrescriptionForm = Omit<PrescriptionUploadRequest, 'file'> & {
  /** `undefined` tant que le visiteur n'a pas choisi de fichier : la validation renvoie alors le message d'erreur. */
  file: File | undefined;
};

/** Un message par champ invalide, `undefined` pour un champ valide. */
export type PrescriptionFormErrors = { [FieldName in keyof PrescriptionForm]?: string };

/** Valide sans rien envoyer, avec le même schéma que l'API : utile pour l'étape courante d'un formulaire par étapes. */
export function validatePrescriptionForm(form: PrescriptionForm): PrescriptionFormErrors {
  const validation = v.safeParse(PrescriptionUploadRequestSchema, form);
  if (validation.success) return {};
  const errors = v.flatten<typeof PrescriptionUploadRequestSchema>(validation.issues).nested ?? {};
  return {
    firstName: errors.firstName?.[0],
    lastName: errors.lastName?.[0],
    phone: errors.phone?.[0],
    file: errors.file?.[0],
  };
}

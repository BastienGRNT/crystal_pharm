import { PrescriptionUploadRequestSchema } from '@crystal-pharm/schema';
import * as v from 'valibot';

/** Ce que le formulaire du layout doit fournir. Les fichiers valent `undefined` tant que le visiteur n'en a pas choisi. */
export type PrescriptionForm = {
  firstName: string;
  lastName: string;
  /** `2026-03-14`, la valeur d'un `<input type="date">`. */
  birthDate: string;
  phone: string;
  /** `2026-03-14T17:30`, la valeur d'un `<input type="datetime-local">`. */
  plannedVisitAt: string;
  hasAlreadyVisited: boolean;
  prescriptionFile: File | undefined;
  /** Au choix avec la photo de la carte Vitale ; vide si non renseigné. */
  socialSecurityNumber: string;
  vitalCardPhoto: File | undefined;
  mutualCardFront: File | undefined;
  mutualCardBack: File | undefined;
};

/** Un message par champ invalide, `undefined` pour un champ valide. */
export type PrescriptionFormErrors = { [FieldName in keyof PrescriptionForm]?: string };

/** Un client déjà venu n'a ni carte Vitale ni mutuelle à fournir : on les écarte, même si le formulaire les a encore en mémoire. */
export function withoutDocumentsKnownToThePharmacy(form: PrescriptionForm): PrescriptionForm {
  if (!form.hasAlreadyVisited) return form;
  return { ...form, socialSecurityNumber: '', vitalCardPhoto: undefined, mutualCardFront: undefined, mutualCardBack: undefined };
}

/** Valide sans rien envoyer, avec le même schéma que l'API : utile pour l'étape courante d'un formulaire par étapes. */
export function validatePrescriptionForm(form: PrescriptionForm): PrescriptionFormErrors {
  const validation = v.safeParse(PrescriptionUploadRequestSchema, withoutDocumentsKnownToThePharmacy(form));
  if (validation.success) return {};
  const messagesByField = v.flatten<typeof PrescriptionUploadRequestSchema>(validation.issues).nested ?? {};
  return Object.fromEntries(Object.entries(messagesByField).map(([fieldName, messages]) => [fieldName, messages?.[0]]));
}

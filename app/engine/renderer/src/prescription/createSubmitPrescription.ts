import { PrescriptionUploadRequestSchema, type PrescriptionUploadRequest } from '@crystal-pharm/schema';
import * as v from 'valibot';
import { validatePrescriptionForm, withoutDocumentsKnownToThePharmacy, type PrescriptionForm, type PrescriptionFormErrors } from './validatePrescriptionForm';

export type PrescriptionSubmissionResult =
  | { outcome: 'sent' }
  | { outcome: 'invalid'; errorsByField: PrescriptionFormErrors }
  | { outcome: 'failed' };

export type SubmitPrescription = (form: PrescriptionForm) => Promise<PrescriptionSubmissionResult>;

/** Fournie par l'app qui sert le site : elle seule sait où et comment envoyer, et pour quel tenant. */
export type SendPrescription = (request: PrescriptionUploadRequest) => Promise<{ outcome: 'sent' } | { outcome: 'failed' }>;

/** Le seul moyen pour un layout d'envoyer une ordonnance : rien ne part sans avoir été validé par le schéma de l'API. */
export function createSubmitPrescription(sendPrescription: SendPrescription): SubmitPrescription {
  return async (form) => {
    const errorsByField = validatePrescriptionForm(form);
    if (Object.values(errorsByField).some((error) => error !== undefined)) return { outcome: 'invalid', errorsByField };
    return sendPrescription(v.parse(PrescriptionUploadRequestSchema, withoutDocumentsKnownToThePharmacy(form)));
  };
}

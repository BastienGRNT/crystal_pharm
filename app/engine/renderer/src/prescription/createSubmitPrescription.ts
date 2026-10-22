import { PrescriptionUploadRequestSchema } from '@crystal-pharm/schema';
import * as v from 'valibot';
import { validatePrescriptionForm, type PrescriptionForm, type PrescriptionFormErrors } from './validatePrescriptionForm';

export type PrescriptionSubmissionResult =
  | { outcome: 'sent' }
  | { outcome: 'invalid'; errorsByField: PrescriptionFormErrors }
  | { outcome: 'failed' };

export type SubmitPrescription = (form: PrescriptionForm) => Promise<PrescriptionSubmissionResult>;

/**
 * Le seul appel réseau du moteur, et le seul moyen pour un layout d'envoyer une ordonnance :
 * le layout ne connaît ni l'URL de l'API ni le tenant.
 */
export function createSubmitPrescription(connection: { apiBaseUrl: string; tenantId: string }): SubmitPrescription {
  return async (form) => {
    const errorsByField = validatePrescriptionForm(form);
    if (Object.values(errorsByField).some((error) => error !== undefined)) return { outcome: 'invalid', errorsByField };

    const request = v.parse(PrescriptionUploadRequestSchema, { ...form, tenantId: connection.tenantId });
    const formData = new FormData();
    for (const [fieldName, value] of Object.entries(request)) formData.set(fieldName, value);
    try {
      const response = await fetch(`${connection.apiBaseUrl}/prescriptions`, { method: 'POST', body: formData });
      return response.ok ? { outcome: 'sent' } : { outcome: 'failed' };
    } catch {
      return { outcome: 'failed' };
    }
  };
}

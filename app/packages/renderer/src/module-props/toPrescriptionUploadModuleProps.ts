import type { PrescriptionUploadModuleData } from '@crystal-pharm/schema';
import type { SubmitPrescription } from '../prescription/createSubmitPrescription';
import { validatePrescriptionForm } from '../prescription/validatePrescriptionForm';

export type PrescriptionUploadModuleProps = {
  introduction?: string;
  /** Le formulaire est écrit librement par le layout ; il l'envoie obligatoirement avec cette fonction. */
  submitPrescription: SubmitPrescription;
  /** Pour valider une partie du formulaire sans l'envoyer, par exemple à chaque étape. */
  validatePrescription: typeof validatePrescriptionForm;
};

export function toPrescriptionUploadModuleProps(
  data: PrescriptionUploadModuleData,
  submitPrescription: SubmitPrescription,
): PrescriptionUploadModuleProps {
  return { introduction: data.introduction, submitPrescription, validatePrescription: validatePrescriptionForm };
}

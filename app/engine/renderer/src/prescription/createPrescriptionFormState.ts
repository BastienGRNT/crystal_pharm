import { createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';
import type { SubmitPrescription } from './createSubmitPrescription';
import type { PrescriptionForm, PrescriptionFormErrors, validatePrescriptionForm } from './validatePrescriptionForm';

export type PrescriptionFormStatus = 'editing' | 'sending' | 'sent' | 'failed';

const emptyPrescriptionForm: PrescriptionForm = {
  firstName: '',
  lastName: '',
  birthDate: '',
  phone: '',
  plannedVisitAt: '',
  hasAlreadyVisited: false,
  prescriptionFile: undefined,
  socialSecurityNumber: '',
  vitalCardPhoto: undefined,
  mutualCardFront: undefined,
  mutualCardBack: undefined,
};

/** L'état d'un formulaire d'ordonnance (valeurs, erreurs, envoi) : le layout n'écrit plus que le rendu. */
export function createPrescriptionFormState(prescription: {
  submitPrescription: SubmitPrescription;
  validatePrescription: typeof validatePrescriptionForm;
}) {
  const [form, setForm] = createStore<PrescriptionForm>({ ...emptyPrescriptionForm });
  const [errorsByField, setErrorsByField] = createSignal<PrescriptionFormErrors>({});
  const [status, setStatus] = createSignal<PrescriptionFormStatus>('editing');

  function updateField<FieldName extends keyof PrescriptionForm>(fieldName: FieldName, value: PrescriptionForm[FieldName]): void {
    setForm({ [fieldName]: value } as Partial<PrescriptionForm>);
    setErrorsByField({ ...errorsByField(), [fieldName]: undefined });
  }

  /** La mutuelle se choisit en un seul geste : un PDF, ou une à deux photos (recto, verso). */
  function setMutualCardFiles(files: ReadonlyArray<File>): void {
    setForm({ mutualCardFront: files[0], mutualCardBack: files[1] });
    setErrorsByField({ ...errorsByField(), mutualCardFront: undefined, mutualCardBack: undefined });
  }

  /** Affiche les erreurs de ces champs seulement et dit s'ils sont tous valides : pour passer à l'étape suivante. */
  function validateFields(fieldNames: ReadonlyArray<keyof PrescriptionForm>): boolean {
    const allErrors = prescription.validatePrescription({ ...form });
    setErrorsByField(Object.fromEntries(fieldNames.map((fieldName) => [fieldName, allErrors[fieldName]])));
    return fieldNames.every((fieldName) => allErrors[fieldName] === undefined);
  }

  async function send(): Promise<PrescriptionFormErrors> {
    setStatus('sending');
    const result = await prescription.submitPrescription({ ...form });
    const errors = result.outcome === 'invalid' ? result.errorsByField : {};
    setErrorsByField(errors);
    setStatus(result.outcome === 'invalid' ? 'editing' : result.outcome);
    return errors;
  }

  return { form, updateField, setMutualCardFiles, errorsByField, status, validateFields, send };
}

export type PrescriptionFormState = ReturnType<typeof createPrescriptionFormState>;

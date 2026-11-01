import { createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';
import { MaximumPrescriptionPages } from '@crystal-pharm/schema';
import type { SubmitPrescription } from './createSubmitPrescription';
import type { PrescriptionForm, PrescriptionFormErrors, validatePrescriptionForm } from './validatePrescriptionForm';

export type PrescriptionFormStatus = 'editing' | 'sending' | 'sent' | 'failed';

const emptyPrescriptionForm: PrescriptionForm = {
  firstName: '',
  lastName: '',
  birthDate: '',
  phone: '',
  email: '',
  plannedVisitAt: '',
  hasAlreadyVisited: false,
  isRenewal: false,
  noteFromPatient: '',
  prescriptionFile: undefined,
  additionalPrescriptionPages: [],
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

  /** Les pages de l'ordonnance, dans l'ordre : la première est obligatoire, les autres suivent. */
  function setPrescriptionPages(pages: ReadonlyArray<File>): void {
    setForm({ prescriptionFile: pages[0], additionalPrescriptionPages: pages.slice(1, MaximumPrescriptionPages) });
    setErrorsByField({ ...errorsByField(), prescriptionFile: undefined, additionalPrescriptionPages: undefined });
  }

  function prescriptionPages(): File[] {
    return form.prescriptionFile ? [form.prescriptionFile, ...form.additionalPrescriptionPages] : [];
  }

  /** Remplit ce que le patient a déjà saisi lors d'un envoi précédent, sans écraser ce qu'il vient de taper. */
  function prefill(knownFields: Partial<Pick<PrescriptionForm, 'firstName' | 'lastName' | 'birthDate' | 'phone' | 'email'>>): void {
    for (const [fieldName, value] of Object.entries(knownFields) as [keyof typeof knownFields, string | undefined][]) {
      if (value && form[fieldName] === '') setForm({ [fieldName]: value });
    }
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

  return {
    form,
    updateField,
    setMutualCardFiles,
    setPrescriptionPages,
    prescriptionPages,
    prefill,
    errorsByField,
    status,
    validateFields,
    send,
  };
}

export type PrescriptionFormState = ReturnType<typeof createPrescriptionFormState>;

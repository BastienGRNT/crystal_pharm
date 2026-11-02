import type { PrescriptionUploadModuleProps } from '@crystal-pharm/renderer';
import { PrescriptionForm } from './PrescriptionForm';

export function PrescriptionSection(props: PrescriptionUploadModuleProps) {
  return (
    <section class="cl-prescription" aria-labelledby="cl-prescription-title">
      <header class="cl-prescription__header">
        <h1 class="cl-prescription__title" id="cl-prescription-title">
          Envoyer une ordonnance
        </h1>
        <p class="cl-prescription__introduction">{props.introduction ?? 'Une photo suffit : nous préparons tout, vous n’avez plus qu’à passer la prendre.'}</p>
      </header>
      <div class="cl-panel">
        <PrescriptionForm submitPrescription={props.submitPrescription} validatePrescription={props.validatePrescription} />
      </div>
    </section>
  );
}

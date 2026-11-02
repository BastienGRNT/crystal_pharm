import type { PrescriptionUploadModuleProps } from '@crystal-pharm/renderer';
import { PrescriptionForm } from './PrescriptionForm';

export function PrescriptionSection(props: PrescriptionUploadModuleProps) {
  return (
    <section class="sc-prescription" aria-labelledby="sc-prescription-title">
      <header class="sc-prescription__header">
        <h1 class="sc-prescription__title" id="sc-prescription-title">
          Envoyer une ordonnance
        </h1>
        <p class="sc-prescription__introduction">{props.introduction ?? 'Une photo suffit : nous préparons tout, vous n’avez plus qu’à passer la prendre.'}</p>
      </header>
      <div class="sc-panel">
        <PrescriptionForm submitPrescription={props.submitPrescription} validatePrescription={props.validatePrescription} />
      </div>
    </section>
  );
}

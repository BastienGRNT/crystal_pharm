import type { PrescriptionUploadModuleProps } from '@crystal-pharm/renderer';
import { PrescriptionForm } from './PrescriptionForm';

export function PrescriptionSection(props: PrescriptionUploadModuleProps) {
  return (
    <section class="ap-prescription" aria-labelledby="ap-prescription-title">
      <header class="ap-prescription__header">
        <h1 class="ap-prescription__title" id="ap-prescription-title">
          Envoyer une ordonnance
        </h1>
        <p class="ap-prescription__introduction">{props.introduction ?? 'Une photo suffit : nous préparons tout, vous n’avez plus qu’à passer la prendre.'}</p>
      </header>
      <div class="ap-panel">
        <PrescriptionForm submitPrescription={props.submitPrescription} validatePrescription={props.validatePrescription} />
      </div>
    </section>
  );
}

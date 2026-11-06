import type { PrescriptionUploadModuleProps } from '@crystal-pharm/renderer';
import { PrescriptionForm } from './PrescriptionForm';

export function PrescriptionSection(props: PrescriptionUploadModuleProps) {
  return (
    <section class="sb-prescription" aria-labelledby="sb-prescription-title">
      <header class="sb-prescription__header">
        <h1 class="sb-prescription__title" id="sb-prescription-title">
          Envoyer une ordonnance
        </h1>
        <p class="sb-prescription__introduction">{props.introduction ?? 'Une photo suffit : nous préparons tout, vous n’avez plus qu’à passer la prendre.'}</p>
      </header>
      <div class="sb-panel">
        <PrescriptionForm submitPrescription={props.submitPrescription} validatePrescription={props.validatePrescription} />
      </div>
    </section>
  );
}

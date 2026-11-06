import type { PrescriptionUploadModuleProps } from '@crystal-pharm/renderer';
import { PrescriptionForm } from './PrescriptionForm';

export function PrescriptionSection(props: PrescriptionUploadModuleProps) {
  return (
    <section class="nb-prescription" aria-labelledby="nb-prescription-title">
      <header class="nb-prescription__header">
        <span class="nb-section-heading__eyebrow">Sans faire la queue</span>
        <h1 class="nb-prescription__title" id="nb-prescription-title">
          Envoyer une ordonnance
        </h1>
        <p class="nb-prescription__introduction">
          {props.introduction ?? 'Une photo suffit : nous préparons tout, vous n’avez plus qu’à passer la prendre.'}
        </p>
      </header>
      <PrescriptionForm submitPrescription={props.submitPrescription} validatePrescription={props.validatePrescription} />
    </section>
  );
}

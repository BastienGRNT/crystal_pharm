import type { PrescriptionUploadModuleProps } from '@crystal-pharm/renderer';
import { PrescriptionForm } from './PrescriptionForm';

export function PrescriptionSection(props: PrescriptionUploadModuleProps) {
  return (
    <section class="nb-section nb-prescription">
      <div class="nb-prescription__intro">
        <span class="nb-section-heading__eyebrow">Gagnez du temps</span>
        <h1 class="nb-prescription__title">Envoyer une ordonnance</h1>
        <p>{props.introduction ?? 'Envoyez-nous une photo de votre ordonnance : nous préparons tout avant votre passage.'}</p>
        <ol class="nb-prescription__steps">
          <li>Vous nous envoyez votre ordonnance.</li>
          <li>Nous préparons votre commande.</li>
          <li>Nous vous appelons : il ne reste qu'à passer la chercher.</li>
        </ol>
      </div>
      <div class="nb-prescription__form-card">
        <PrescriptionForm submitPrescription={props.submitPrescription} />
      </div>
    </section>
  );
}

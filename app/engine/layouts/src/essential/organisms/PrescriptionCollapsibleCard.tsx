import { createSignal, Show } from 'solid-js';
import type { PrescriptionUploadModuleProps } from '@crystal-pharm/renderer';
import { PrescriptionForm } from './PrescriptionForm';

/** Une carte repliée ; au clic, elle se déplie (animation en CSS) et montre le formulaire. */
export function PrescriptionCollapsibleCard(props: PrescriptionUploadModuleProps) {
  const [isOpen, setIsOpen] = createSignal(false);
  return (
    <section class="essential-block essential-prescription" classList={{ 'essential-prescription--open': isOpen() }}>
      <button class="essential-prescription__toggle" type="button" aria-expanded={isOpen()} onClick={() => setIsOpen(!isOpen())}>
        <span>Envoyer une ordonnance</span>
        <span class="essential-prescription__toggle-sign" aria-hidden="true">
          {isOpen() ? '−' : '+'}
        </span>
      </button>
      <div class="essential-prescription__panel" inert={!isOpen()}>
        <div class="essential-prescription__panel-content">
          <Show when={props.introduction}>{(introduction) => <p class="essential-prescription__introduction">{introduction()}</p>}</Show>
          <PrescriptionForm submitPrescription={props.submitPrescription} validatePrescription={props.validatePrescription} />
        </div>
      </div>
    </section>
  );
}

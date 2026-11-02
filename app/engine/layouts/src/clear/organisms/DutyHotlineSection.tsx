import type { DutyHotlineModuleProps } from '@crystal-pharm/renderer';

export function DutyHotlineSection(props: DutyHotlineModuleProps) {
  return (
    <section class="cl-duty" aria-labelledby="cl-duty-title">
      <h2 class="cl-duty__title" id="cl-duty-title">
        Pharmacie de garde
      </h2>
      <p class="cl-duty__message">{props.message}</p>
      <a class="cl-duty__number" href={`tel:${props.phoneNumber}`}>
        <span class="cl-duty__digits">{props.phoneNumber}</span>
        <span class="cl-duty__call">Appeler</span>
      </a>
    </section>
  );
}

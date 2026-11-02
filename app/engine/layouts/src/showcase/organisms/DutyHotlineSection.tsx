import type { DutyHotlineModuleProps } from '@crystal-pharm/renderer';

export function DutyHotlineSection(props: DutyHotlineModuleProps) {
  return (
    <section class="sc-duty" aria-labelledby="sc-duty-title">
      <h2 class="sc-duty__title" id="sc-duty-title">
        Pharmacie de garde
      </h2>
      <p class="sc-duty__message">{props.message}</p>
      <a class="sc-duty__number" href={`tel:${props.phoneNumber}`}>
        <span class="sc-duty__digits">{props.phoneNumber}</span>
        <span class="sc-duty__call">Appeler</span>
      </a>
    </section>
  );
}

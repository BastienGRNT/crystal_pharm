import type { DutyHotlineModuleProps } from '@crystal-pharm/renderer';

export function DutyHotlineSection(props: DutyHotlineModuleProps) {
  return (
    <section class="ap-duty" aria-labelledby="ap-duty-title">
      <h2 class="ap-duty__title" id="ap-duty-title">
        Pharmacie de garde
      </h2>
      <p class="ap-duty__message">{props.message}</p>
      <a class="ap-duty__number" href={`tel:${props.phoneNumber}`}>
        <span class="ap-duty__digits">{props.phoneNumber}</span>
        <span class="ap-duty__call">Appeler</span>
      </a>
    </section>
  );
}

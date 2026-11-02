import type { DutyHotlineModuleProps } from '@crystal-pharm/renderer';

export function DutyHotlineSection(props: DutyHotlineModuleProps) {
  return (
    <section class="sb-duty" aria-labelledby="sb-duty-title">
      <h2 class="sb-duty__eyebrow" id="sb-duty-title">
        Pharmacie de garde
      </h2>
      <p class="sb-duty__message">{props.message}</p>
      <a class="sb-duty__number" href={`tel:${props.phoneNumber}`}>
        <span class="sb-duty__digits">{props.phoneNumber}</span>
        <span class="sb-duty__call">Appeler le {props.phoneNumber}</span>
      </a>
    </section>
  );
}

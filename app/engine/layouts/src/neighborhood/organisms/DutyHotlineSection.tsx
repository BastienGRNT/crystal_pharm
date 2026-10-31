import type { DutyHotlineModuleProps } from '@crystal-pharm/renderer';

export function DutyHotlineSection(props: DutyHotlineModuleProps) {
  return (
    <p class="nb-duty-hotline">
      {props.message} <a href={`tel:${props.phoneNumber}`}>{props.phoneNumber}</a>
    </p>
  );
}

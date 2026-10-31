import type { DutyHotlineModuleProps } from '@crystal-pharm/renderer';

export function DutyHotlinePanel(props: DutyHotlineModuleProps) {
  return (
    <p class="at-duty-hotline">
      <a href={`tel:${props.phoneNumber}`}>{props.message}</a>
    </p>
  );
}

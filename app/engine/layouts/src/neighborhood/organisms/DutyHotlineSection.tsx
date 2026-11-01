import type { DutyHotlineModuleProps } from '@crystal-pharm/renderer';
import { Icon } from '../atoms/Icon';

export function DutyHotlineSection(props: DutyHotlineModuleProps) {
  return (
    <p class="nb-duty-hotline">
      <Icon name="moon" />
      <span>
        {props.message} <a href={`tel:${props.phoneNumber}`}>{props.phoneNumber}</a>
      </span>
    </p>
  );
}

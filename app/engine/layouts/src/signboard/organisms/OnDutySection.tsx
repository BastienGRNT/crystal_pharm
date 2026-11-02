import { Show } from 'solid-js';
import type { OnDutySectionProps } from '@crystal-pharm/renderer';
import { LedCross } from '../atoms/LedCross';

/** La garde en cours est déjà dans l'état d'ouverture : ce bandeau n'annonce que celle qui commence plus tard dans la journée. */
export function OnDutySection(props: OnDutySectionProps) {
  return (
    <Show when={props.announcement?.status === 'onDutyLaterToday' ? props.announcement : undefined}>
      {(announcement) => (
        <p class="sb-on-duty" role="status">
          <LedCross class="sb-on-duty__cross" />
          <span>{announcement().message}</span>
        </p>
      )}
    </Show>
  );
}

import { Show } from 'solid-js';
import type { OnDutySectionProps } from '@crystal-pharm/renderer';

/** La garde en cours est déjà dans l'état d'ouverture de la colonne : cet aplat n'annonce que celle qui commence plus tard dans la journée. */
export function OnDutyNotice(props: OnDutySectionProps) {
  return (
    <Show when={props.announcement?.status === 'onDutyLaterToday' ? props.announcement : undefined}>
      {(announcement) => (
        <p class="at-on-duty" role="status">
          {announcement().message}
        </p>
      )}
    </Show>
  );
}

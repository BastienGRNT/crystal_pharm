import { Show } from 'solid-js';
import type { OpeningHoursSectionProps } from '@crystal-pharm/renderer';

/** Une ligne du tableau lumineux : le jour, puis ses horaires en chiffres à points. Aujourd'hui est allumé. */
export function OpeningBoardRow(props: { day: OpeningHoursSectionProps['days'][number] }) {
  return (
    <tr class="sb-board__row" classList={{ 'sb-board__row--today': props.day.isToday }}>
      <th class="sb-board__day" scope="row">
        <span class="sb-board__marker" aria-hidden="true" />
        {props.day.label}
        <Show when={props.day.isToday}>
          <span class="sb-board__today">Aujourd’hui</span>
        </Show>
      </th>
      <td class="sb-board__hours">
        <Show when={props.day.openingPeriodLabels.length > 0} fallback="Fermé">
          {props.day.openingPeriodLabels.join(' · ')}
        </Show>
      </td>
    </tr>
  );
}

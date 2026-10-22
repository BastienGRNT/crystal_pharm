import { Show } from 'solid-js';
import type { OpeningHoursModuleProps } from '@crystal-pharm/renderer';

export function OpeningDayRow(props: { day: OpeningHoursModuleProps['days'][number] }) {
  return (
    <tr class="essential-hours__row" classList={{ 'essential-hours__row--today': props.day.isToday }}>
      <th class="essential-hours__day" scope="row">
        {props.day.label}
      </th>
      <td class="essential-hours__periods">
        <Show when={props.day.openingPeriodLabels.length > 0} fallback="Fermé">
          {props.day.openingPeriodLabels.join(' / ')}
        </Show>
      </td>
    </tr>
  );
}

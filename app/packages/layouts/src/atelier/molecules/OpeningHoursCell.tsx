import { For, Show } from 'solid-js';
import type { OpeningHoursModuleProps } from '@crystal-pharm/renderer';

export function OpeningHoursCell(props: { day: OpeningHoursModuleProps['days'][number] }) {
  return (
    <li class="at-hours__cell" classList={{ 'at-hours__cell--today': props.day.isToday }}>
      <span class="at-hours__day">{props.day.label}</span>
      <Show when={props.day.openingPeriodLabels.length > 0} fallback={<span class="at-hours__closed">Fermé</span>}>
        <For each={props.day.openingPeriodLabels}>{(periodLabel) => <span class="at-hours__period">{periodLabel}</span>}</For>
      </Show>
    </li>
  );
}

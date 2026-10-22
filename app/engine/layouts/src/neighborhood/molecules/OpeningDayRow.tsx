import { For, Show } from 'solid-js';
import type { OpeningHoursModuleProps } from '@crystal-pharm/renderer';

export function OpeningDayRow(props: { day: OpeningHoursModuleProps['days'][number] }) {
  return (
    <li class="nb-day" classList={{ 'nb-day--today': props.day.isToday }}>
      <span class="nb-day__label">
        {props.day.label}
        <Show when={props.day.isToday}>
          <span class="nb-day__today">Aujourd'hui</span>
        </Show>
      </span>
      <span class="nb-day__periods">
        <Show when={props.day.openingPeriodLabels.length > 0} fallback={<span class="nb-day__closed">Fermé</span>}>
          <For each={props.day.openingPeriodLabels}>{(periodLabel) => <span>{periodLabel}</span>}</For>
        </Show>
      </span>
    </li>
  );
}

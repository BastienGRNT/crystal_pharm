import { For, Show } from 'solid-js';
import type { OpeningHoursSectionProps } from '@crystal-pharm/renderer';

export function OpeningDayRow(props: { day: OpeningHoursSectionProps['days'][number] }) {
  return (
    <li class="sc-week__day" classList={{ 'sc-week__day--today': props.day.isToday }}>
      <span class="sc-week__label">
        {props.day.label}
        <Show when={props.day.isToday}>
          <span class="sc-week__today">Aujourd’hui</span>
        </Show>
      </span>
      <span class="sc-week__leader" aria-hidden="true" />
      <span class="sc-week__periods">
        <Show when={props.day.openingPeriodLabels.length > 0} fallback={<span class="sc-week__closed">Fermé</span>}>
          <For each={props.day.openingPeriodLabels}>{(periodLabel) => <span class="sc-week__period">{periodLabel}</span>}</For>
        </Show>
      </span>
    </li>
  );
}

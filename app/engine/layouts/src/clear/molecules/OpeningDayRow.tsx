import { For, Show } from 'solid-js';
import type { OpeningHoursSectionProps } from '@crystal-pharm/renderer';

export function OpeningDayRow(props: { day: OpeningHoursSectionProps['days'][number] }) {
  return (
    <li class="cl-week__day" classList={{ 'cl-week__day--today': props.day.isToday }}>
      <span class="cl-week__label">
        {props.day.label}
        <Show when={props.day.isToday}>
          <span class="cl-week__today">Aujourd’hui</span>
        </Show>
      </span>
      <span class="cl-week__leader" aria-hidden="true" />
      <span class="cl-week__periods">
        <Show when={props.day.openingPeriodLabels.length > 0} fallback={<span class="cl-week__closed">Fermé</span>}>
          <For each={props.day.openingPeriodLabels}>{(periodLabel) => <span class="cl-week__period">{periodLabel}</span>}</For>
        </Show>
      </span>
    </li>
  );
}

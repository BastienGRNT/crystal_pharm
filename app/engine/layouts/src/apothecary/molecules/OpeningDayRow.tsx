import { For, Show } from 'solid-js';
import type { OpeningHoursSectionProps } from '@crystal-pharm/renderer';

export function OpeningDayRow(props: { day: OpeningHoursSectionProps['days'][number] }) {
  return (
    <li class="ap-week__day" classList={{ 'ap-week__day--today': props.day.isToday }}>
      <span class="ap-week__label">
        {props.day.label}
        <Show when={props.day.isToday}>
          <span class="ap-week__today">Aujourd’hui</span>
        </Show>
      </span>
      <span class="ap-week__leader" aria-hidden="true" />
      <span class="ap-week__periods">
        <Show when={props.day.openingPeriodLabels.length > 0} fallback={<span class="ap-week__closed">Fermé</span>}>
          <For each={props.day.openingPeriodLabels}>{(periodLabel) => <span class="ap-week__period">{periodLabel}</span>}</For>
        </Show>
      </span>
    </li>
  );
}

import { For } from 'solid-js';
import type { OpeningHoursSectionProps } from '@crystal-pharm/renderer';
import { OpeningDayRow } from '../molecules/OpeningDayRow';

export function OpeningHoursSection(props: OpeningHoursSectionProps) {
  return (
    <section class="nb-hours" id="horaires" aria-labelledby="nb-hours-title">
      <h2 class="nb-panel-title" id="nb-hours-title">
        Horaires
      </h2>
      <ul class="nb-hours__days">
        <For each={props.days}>{(day) => <OpeningDayRow day={day} />}</For>
      </ul>
    </section>
  );
}

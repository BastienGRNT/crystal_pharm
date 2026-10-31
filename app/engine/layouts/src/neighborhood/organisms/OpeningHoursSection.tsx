import { For } from 'solid-js';
import type { OpeningHoursSectionProps } from '@crystal-pharm/renderer';
import { SectionHeading } from '../atoms/SectionHeading';
import { OpeningDayRow } from '../molecules/OpeningDayRow';

export function OpeningHoursSection(props: OpeningHoursSectionProps) {
  return (
    <section class="nb-section nb-hours" id="horaires">
      <SectionHeading eyebrow="Quand passer ?" title="Nos horaires" />
      <ul class="nb-hours__days">
        <For each={props.days}>{(day) => <OpeningDayRow day={day} />}</For>
      </ul>
    </section>
  );
}

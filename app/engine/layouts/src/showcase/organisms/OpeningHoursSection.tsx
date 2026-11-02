import { For } from 'solid-js';
import type { OpeningHoursSectionProps } from '@crystal-pharm/renderer';
import { SectionHeading } from '../atoms/SectionHeading';
import { OpeningDayRow } from '../molecules/OpeningDayRow';

export function OpeningHoursSection(props: OpeningHoursSectionProps) {
  return (
    <section id="horaires" class="sc-hours" aria-labelledby="sc-hours-title">
      <SectionHeading id="sc-hours-title">Horaires</SectionHeading>
      <ol class="sc-week">
        <For each={props.days}>{(day) => <OpeningDayRow day={day} />}</For>
      </ol>
    </section>
  );
}

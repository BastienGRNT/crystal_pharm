import { For } from 'solid-js';
import type { OpeningHoursSectionProps } from '@crystal-pharm/renderer';
import { SectionHeading } from '../atoms/SectionHeading';
import { OpeningDayRow } from '../molecules/OpeningDayRow';

export function OpeningHoursSection(props: OpeningHoursSectionProps) {
  return (
    <section id="horaires" class="cl-hours" aria-labelledby="cl-hours-title">
      <SectionHeading id="cl-hours-title">Horaires</SectionHeading>
      <ol class="cl-week">
        <For each={props.days}>{(day) => <OpeningDayRow day={day} />}</For>
      </ol>
    </section>
  );
}

import { For } from 'solid-js';
import type { OpeningHoursSectionProps } from '@crystal-pharm/renderer';
import { SectionHeading } from '../atoms/SectionHeading';
import { OpeningDayRow } from '../molecules/OpeningDayRow';

export function OpeningHoursSection(props: OpeningHoursSectionProps) {
  return (
    <section id="horaires" class="ap-hours" aria-labelledby="ap-hours-title">
      <SectionHeading id="ap-hours-title">Horaires</SectionHeading>
      <ol class="ap-week">
        <For each={props.days}>{(day) => <OpeningDayRow day={day} />}</For>
      </ol>
    </section>
  );
}

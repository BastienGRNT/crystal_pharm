import { For } from 'solid-js';
import type { OpeningHoursSectionProps } from '@crystal-pharm/renderer';
import { SectionHeading } from '../atoms/SectionHeading';
import { OpeningDayRow } from '../molecules/OpeningDayRow';

export function OpeningHoursBlock(props: OpeningHoursSectionProps) {
  return (
    <section class="essential-block essential-block--hours">
      <SectionHeading>Horaires</SectionHeading>
      <table class="essential-hours">
        <tbody>
          <For each={props.days}>{(day) => <OpeningDayRow day={day} />}</For>
        </tbody>
      </table>
    </section>
  );
}

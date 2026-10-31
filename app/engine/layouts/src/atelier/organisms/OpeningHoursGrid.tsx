import { For } from 'solid-js';
import type { OpeningHoursSectionProps } from '@crystal-pharm/renderer';
import { SectionTitle } from '../atoms/SectionTitle';
import { OpeningHoursCell } from '../molecules/OpeningHoursCell';

export function OpeningHoursGrid(props: OpeningHoursSectionProps) {
  return (
    <section class="at-section at-hours">
      <SectionTitle>Horaires</SectionTitle>
      <div class="at-section__content">
        <ol class="at-hours__week">
          <For each={props.days}>{(day) => <OpeningHoursCell day={day} />}</For>
        </ol>
      </div>
    </section>
  );
}

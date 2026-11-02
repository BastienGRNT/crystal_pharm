import { For } from 'solid-js';
import type { OpeningHoursSectionProps } from '@crystal-pharm/renderer';
import { SectionHeading } from '../atoms/SectionHeading';
import { OpeningBoardRow } from '../molecules/OpeningBoardRow';

/** Les horaires comme un tableau des départs : un jour par ligne, aujourd'hui allumé. */
export function OpeningHoursSection(props: OpeningHoursSectionProps) {
  return (
    <section id="horaires" class="sb-hours" aria-labelledby="sb-hours-title">
      <SectionHeading id="sb-hours-title">Horaires</SectionHeading>
      <table class="sb-board">
        <thead>
          <tr>
            <th scope="col">Jour</th>
            <th scope="col">Ouverture</th>
          </tr>
        </thead>
        <tbody>
          <For each={props.days}>{(day) => <OpeningBoardRow day={day} />}</For>
        </tbody>
      </table>
    </section>
  );
}

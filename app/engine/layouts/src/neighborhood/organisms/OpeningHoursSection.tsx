import { For } from 'solid-js';
import type { OpeningHoursModuleProps } from '@crystal-pharm/renderer';
import { SectionHeading } from '../atoms/SectionHeading';
import { OpeningDayRow } from '../molecules/OpeningDayRow';

export function OpeningHoursSection(props: OpeningHoursModuleProps) {
  return (
    <section class="nb-section nb-hours" id="horaires">
      <SectionHeading eyebrow="Quand passer ?" title="Nos horaires" />
      <div class="nb-hours__layout">
        <ul class="nb-hours__days">
          <For each={props.days}>{(day) => <OpeningDayRow day={day} />}</For>
        </ul>
        <aside class="nb-hours__on-duty">
          <h3>Pharmacie de garde</h3>
          <p>{props.onDutyAnnouncement?.message ?? props.onDutyHotline.message}</p>
          <a class="nb-hours__hotline" href={`tel:${props.onDutyHotline.phoneNumber}`}>
            {props.onDutyHotline.phoneNumber}
          </a>
        </aside>
      </div>
    </section>
  );
}

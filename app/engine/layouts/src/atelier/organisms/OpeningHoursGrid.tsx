import { For, Show } from 'solid-js';
import type { OpeningHoursModuleProps } from '@crystal-pharm/renderer';
import { SectionTitle } from '../atoms/SectionTitle';
import { OpeningHoursCell } from '../molecules/OpeningHoursCell';

export function OpeningHoursGrid(props: OpeningHoursModuleProps) {
  return (
    <section class="at-section at-hours">
      <SectionTitle>Horaires</SectionTitle>
      <div class="at-section__content">
        <Show when={props.onDutyAnnouncement}>{(announcement) => <p class="at-hours__on-duty">{announcement().message}</p>}</Show>
        <ol class="at-hours__week">
          <For each={props.days}>{(day) => <OpeningHoursCell day={day} />}</For>
        </ol>
        <p class="at-hours__hotline">
          <a href={`tel:${props.onDutyHotline.phoneNumber}`}>{props.onDutyHotline.message}</a>
        </p>
      </div>
    </section>
  );
}

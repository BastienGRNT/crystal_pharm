import { For, Show } from 'solid-js';
import type { OpeningHoursModuleProps } from '@crystal-pharm/renderer';
import { SectionHeading } from '../atoms/SectionHeading';
import { OpeningDayRow } from '../molecules/OpeningDayRow';

export function OpeningHoursBlock(props: OpeningHoursModuleProps) {
  return (
    <section class="essential-block essential-block--hours">
      <SectionHeading>Horaires</SectionHeading>
      <Show when={props.onDutyAnnouncement}>
        {(onDutyAnnouncement) => <p class="essential-on-duty">{onDutyAnnouncement().message}</p>}
      </Show>
      <table class="essential-hours">
        <tbody>
          <For each={props.days}>{(day) => <OpeningDayRow day={day} />}</For>
        </tbody>
      </table>
      <a class="essential-hotline" href={`tel:${props.onDutyHotline.phoneNumber}`}>
        {props.onDutyHotline.message}
      </a>
    </section>
  );
}

import { Show } from 'solid-js';
import type { OnDutySectionProps } from '@crystal-pharm/renderer';
import { SectionHeading } from '../atoms/SectionHeading';

export function OnDutyBlock(props: OnDutySectionProps) {
  return (
    <section class="essential-block essential-block--on-duty">
      <SectionHeading>Garde</SectionHeading>
      <Show when={props.announcement}>{(announcement) => <p class="essential-on-duty">{announcement().message}</p>}</Show>
      <a class="essential-hotline" href={`tel:${props.hotline.phoneNumber}`}>
        {props.hotline.message}
      </a>
    </section>
  );
}

import type { DutyHotlineModuleProps } from '@crystal-pharm/renderer';
import { SectionHeading } from '../atoms/SectionHeading';

export function DutyHotlineBlock(props: DutyHotlineModuleProps) {
  return (
    <section class="essential-block essential-block--duty-hotline">
      <SectionHeading>Pharmacie de garde</SectionHeading>
      <a class="essential-hotline" href={`tel:${props.phoneNumber}`}>
        {props.message}
      </a>
    </section>
  );
}

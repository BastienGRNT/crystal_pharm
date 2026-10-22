import { For } from 'solid-js';
import type { TeamModuleProps } from '@crystal-pharm/renderer';
import { SectionHeading } from '../atoms/SectionHeading';
import { TeamMemberRow } from '../molecules/TeamMemberRow';

export function TeamBlock(props: TeamModuleProps) {
  return (
    <section class="essential-block essential-block--team">
      <SectionHeading>Équipe</SectionHeading>
      <ul class="essential-team">
        <For each={props.members}>{(member) => <TeamMemberRow member={member} />}</For>
      </ul>
    </section>
  );
}

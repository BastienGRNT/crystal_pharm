import { For } from 'solid-js';
import type { TeamModuleProps } from '@crystal-pharm/renderer';
import { SectionHeading } from '../atoms/SectionHeading';
import { TeamMemberCard } from '../molecules/TeamMemberCard';

export function TeamSection(props: TeamModuleProps) {
  return (
    <section class="nb-section" id="equipe">
      <SectionHeading eyebrow="Qui vous accueille" title="Notre équipe" />
      <ul class="nb-team">
        <For each={props.members}>{(member) => <TeamMemberCard member={member} />}</For>
      </ul>
    </section>
  );
}

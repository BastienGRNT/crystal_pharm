import { For } from 'solid-js';
import type { TeamModuleProps } from '@crystal-pharm/renderer';
import { SectionHeading } from '../atoms/SectionHeading';
import { TeamMemberCard } from '../molecules/TeamMemberCard';

export function TeamSection(props: TeamModuleProps) {
  return (
    <section id="equipe" class="cl-section cl-section--team" aria-labelledby="cl-team-title">
      <SectionHeading id="cl-team-title">L’équipe</SectionHeading>
      <ul class="cl-team">
        <For each={props.members}>{(member) => <TeamMemberCard member={member} />}</For>
      </ul>
    </section>
  );
}

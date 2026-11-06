import { For } from 'solid-js';
import type { TeamModuleProps } from '@crystal-pharm/renderer';
import { SectionHeading } from '../atoms/SectionHeading';
import { TeamMemberCard } from '../molecules/TeamMemberCard';

export function TeamSection(props: TeamModuleProps) {
  return (
    <section id="equipe" class="ap-section ap-section--team" aria-labelledby="ap-team-title">
      <SectionHeading id="ap-team-title">L’équipe</SectionHeading>
      <ul class="ap-team">
        <For each={props.members}>{(member) => <TeamMemberCard member={member} />}</For>
      </ul>
    </section>
  );
}

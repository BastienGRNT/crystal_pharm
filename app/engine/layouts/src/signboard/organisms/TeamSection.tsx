import { For } from 'solid-js';
import type { TeamModuleProps } from '@crystal-pharm/renderer';
import { SectionHeading } from '../atoms/SectionHeading';
import { TeamMemberCard } from '../molecules/TeamMemberCard';

export function TeamSection(props: TeamModuleProps) {
  return (
    <section id="equipe" class="sb-section" aria-labelledby="sb-team-title">
      <SectionHeading id="sb-team-title">L’équipe</SectionHeading>
      <ul class="sb-team">
        <For each={props.members}>{(member) => <TeamMemberCard member={member} />}</For>
      </ul>
    </section>
  );
}

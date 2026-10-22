import { For } from 'solid-js';
import type { TeamModuleProps } from '@crystal-pharm/renderer';
import { SectionTitle } from '../atoms/SectionTitle';
import { TeamPortrait } from '../molecules/TeamPortrait';

export function TeamGallery(props: TeamModuleProps) {
  return (
    <section class="at-section">
      <SectionTitle>L'équipe</SectionTitle>
      <ul class="at-section__content at-team">
        <For each={props.members}>{(member) => <TeamPortrait member={member} />}</For>
      </ul>
    </section>
  );
}

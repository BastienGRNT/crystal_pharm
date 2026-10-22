import type { TeamModuleProps } from '@crystal-pharm/renderer';
import { RoundPortrait } from '../atoms/RoundPortrait';

export function TeamMemberCard(props: { member: TeamModuleProps['members'][number] }) {
  return (
    <li class="nb-team-card">
      <RoundPortrait photoUrl={props.member.photoUrl} initials={props.member.initials} />
      <strong class="nb-team-card__name">{props.member.fullName}</strong>
      <span class="nb-team-card__role">{props.member.role}</span>
    </li>
  );
}

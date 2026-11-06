import type { TeamModuleProps } from '@crystal-pharm/renderer';
import { LedPortrait } from '../atoms/LedPortrait';

export function TeamMemberCard(props: { member: TeamModuleProps['members'][number] }) {
  return (
    <li class="sb-team__member">
      <LedPortrait photoUrl={props.member.photoUrl} initials={props.member.initials} />
      <span class="sb-team__name">{props.member.fullName}</span>
      <span class="sb-team__role">{props.member.role}</span>
    </li>
  );
}

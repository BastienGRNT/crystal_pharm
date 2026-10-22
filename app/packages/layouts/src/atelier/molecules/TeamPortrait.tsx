import type { TeamModuleProps } from '@crystal-pharm/renderer';
import { Portrait } from '../atoms/Portrait';

export function TeamPortrait(props: { member: TeamModuleProps['members'][number] }) {
  return (
    <li class="at-team__member">
      <Portrait photoUrl={props.member.photoUrl} initials={props.member.initials} />
      <span class="at-team__name">{props.member.fullName}</span>
      <span class="at-team__role">{props.member.role}</span>
    </li>
  );
}

import type { TeamModuleProps } from '@crystal-pharm/renderer';
import { Portrait } from '../atoms/Portrait';

export function TeamMemberCard(props: { member: TeamModuleProps['members'][number] }) {
  return (
    <li class="cl-team__member">
      <Portrait photoUrl={props.member.photoUrl} initials={props.member.initials} />
      <span class="cl-team__name">{props.member.fullName}</span>
      <span class="cl-team__role">{props.member.role}</span>
    </li>
  );
}

import type { TeamModuleProps } from '@crystal-pharm/renderer';
import { PhotoOrInitials } from '../atoms/PhotoOrInitials';

export function TeamMemberRow(props: { member: TeamModuleProps['members'][number] }) {
  return (
    <li class="essential-team__member">
      <PhotoOrInitials photoUrl={props.member.photoUrl} initials={props.member.initials} />
      <span class="essential-team__name">{props.member.fullName}</span>
      <span class="essential-team__role">{props.member.role}</span>
    </li>
  );
}

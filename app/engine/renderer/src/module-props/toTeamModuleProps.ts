import type { TeamModuleData } from '@crystal-pharm/schema';

export type TeamModuleProps = {
  members: Array<{
    fullName: string;
    role: string;
    photoUrl?: string;
    /** Pour remplacer la photo quand elle manque, par exemple « CM » pour Claire Martin. */
    initials: string;
  }>;
};

export function toTeamModuleProps(data: TeamModuleData): TeamModuleProps {
  return {
    members: data.members.map((member) => ({ ...member, initials: toInitials(member.fullName) })),
  };
}

function toInitials(fullName: string): string {
  return fullName
    .split(/[\s-]+/)
    .filter((word) => word.length > 0)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}

import { summarizeSignedInUser, type AuthenticatedUser, type SignedInUserSummary } from '@crystal-pharm/auth';

export type GroupShellData = {
	signedInGroupMember: SignedInUserSummary;
};

export function loadGroupShell({ locals }: { locals: { user: AuthenticatedUser | null } }): GroupShellData {
	return { signedInGroupMember: summarizeSignedInUser(locals.user) };
}

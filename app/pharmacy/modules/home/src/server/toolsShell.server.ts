import { summarizeSignedInUser, type AuthenticatedUser, type SignedInUserSummary } from '@crystal-pharm/auth';

export type ToolsShellData = {
	signedInManager: SignedInUserSummary;
};

export function loadToolsShell({ locals }: { locals: { user: AuthenticatedUser | null } }): ToolsShellData {
	return { signedInManager: summarizeSignedInUser(locals.user) };
}

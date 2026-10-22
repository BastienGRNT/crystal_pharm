import {
	summarizeSignedInUser,
	type AuthenticatedUser,
	type SignedInUserSummary
} from '@crystal-pharm/auth/toolkit';

export type AdminShellData = {
	signedInPlatformAdmin: SignedInUserSummary;
};

export function loadAdminShell({ locals }: { locals: { user: AuthenticatedUser | null } }): AdminShellData {
	return { signedInPlatformAdmin: summarizeSignedInUser(locals.user) };
}

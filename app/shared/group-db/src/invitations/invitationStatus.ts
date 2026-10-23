export type InvitationStatus = 'pending' | 'expired' | 'accepted' | 'declined' | 'revoked';

type InvitationDates = {
	expiresAt: Date;
	acceptedAt: Date | null;
	revokedAt: Date | null;
	declinedAt?: Date | null;
};

export function describeInvitationStatus(invitation: InvitationDates, now: Date): InvitationStatus {
	if (invitation.acceptedAt) return 'accepted';
	if (invitation.revokedAt) return 'revoked';
	if (invitation.declinedAt) return 'declined';
	if (invitation.expiresAt <= now) return 'expired';
	return 'pending';
}

import { createHash, randomBytes } from 'node:crypto';

const invitationLifetimeInDays = 14;

/** Le jeton envoyé dans le lien ; seule son empreinte (`hashInvitationToken`) est stockée. */
export function generateInvitationToken(): string {
	return randomBytes(32).toString('base64url');
}

export function hashInvitationToken(invitationToken: string): string {
	return createHash('sha256').update(invitationToken).digest('hex');
}

export function computeInvitationExpiry(now: Date): Date {
	return new Date(now.getTime() + invitationLifetimeInDays * 24 * 60 * 60 * 1000);
}

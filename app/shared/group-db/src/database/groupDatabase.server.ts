import { applyTransactionSettings, connectToDatabase, type DatabaseTransaction } from '@crystal-pharm/auth/toolkit';

export type GroupTransaction = DatabaseTransaction;

/** Qui agit : chaque champ posé ouvre, par la Row-Level Security, les lignes qui le concernent. */
export type GroupAccess = {
	groupId?: string;
	tenantId?: string;
	accountId?: string;
	accountEmail?: string;
	invitationTokenHash?: string;
	isPlatform?: boolean;
};

export function runWithGroupAccess<Result>(
	access: GroupAccess,
	work: (transaction: GroupTransaction) => Promise<Result>
): Promise<Result> {
	return connectToDatabase().transaction(async (transaction) => {
		await applyTransactionSettings(transaction, toGroupAccessSettings(access));
		return work(transaction);
	});
}

/** Les réglages lus par la Row-Level Security de `groups` et de `billing`. */
export function toGroupAccessSettings(access: GroupAccess): Record<string, string | undefined> {
	return {
		'app.group_id': access.groupId,
		'app.tenant_id': access.tenantId,
		'app.account_id': access.accountId,
		'app.account_email': access.accountEmail?.toLowerCase(),
		'app.invitation_token_hash': access.invitationTokenHash,
		'app.is_platform': access.isPlatform ? 'on' : undefined
	};
}

export const platformAccess: GroupAccess = { isPlatform: true };

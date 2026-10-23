import { and, desc, eq, gt, isNull } from 'drizzle-orm';
import { runWithGroupAccess, type GroupAccess, type GroupTransaction } from '../database/groupDatabase.server';
import { pharmacyGroups, pharmacyInvitations, pharmacyMemberships } from '../database/groupTables';
import { countUsedPlaces } from '../groups/pharmacyGroups.server';
import { invitationUnavailableMessages } from '../members/groupMembers.server';
import type { InvitationListEntry } from './invitationList';
import { describeInvitationStatus, type InvitationStatus } from './invitationStatus';
import { computeInvitationExpiry, generateInvitationToken, hashInvitationToken } from './invitationTokens.server';

export type PendingPharmacyInvitation = {
	invitationId: string;
	email: string;
	pharmacyName: string | undefined;
	expiresAt: Date;
	lastSentAt: Date;
};

/** Ce qu'il faut pour écrire l'email d'une invitation envoyée. */
export type SentPharmacyInvitation = {
	email: string;
	pharmacyName: string | undefined;
	invitationToken: string;
	groupName: string;
};

export type PharmacyInvitationsSending =
	| { isSent: true; sentInvitations: SentPharmacyInvitation[]; skippedEmails: SkippedInvitationEmail[] }
	| { isSent: false; failureMessage: string };

export type SkippedInvitationEmail = { email: string; reason: string };

/** Une invitation telle que la pharmacie invitée la voit. */
export type PharmacyInvitationForPharmacy = {
	invitationId: string;
	groupId: string;
	groupName: string;
	email: string;
	status: InvitationStatus;
	expiresAt: Date;
};

export type PharmacyInvitationAnswer =
	| { isAnswered: true; groupId: string }
	| { isAnswered: false; failureMessage: string };

/** Comment la pharmacie désigne l'invitation : son lien (le jeton), ou son email de compte. */
export type InvitationProof = { invitationToken: string } | { invitationId: string; accountEmail: string };

const pendingInvitationConditions = (now: Date) => [
	isNull(pharmacyInvitations.acceptedAt),
	isNull(pharmacyInvitations.declinedAt),
	isNull(pharmacyInvitations.revokedAt),
	gt(pharmacyInvitations.expiresAt, now)
];

export function listPendingPharmacyInvitations(
	access: GroupAccess,
	groupId: string
): Promise<PendingPharmacyInvitation[]> {
	return runWithGroupAccess(access, async (transaction) => {
		const invitations = await transaction
			.select()
			.from(pharmacyInvitations)
			.where(and(eq(pharmacyInvitations.groupId, groupId), ...pendingInvitationConditions(new Date())))
			.orderBy(desc(pharmacyInvitations.lastSentAt));
		return invitations.map((invitation) => ({
			invitationId: invitation.id,
			email: invitation.email,
			pharmacyName: invitation.pharmacyName ?? undefined,
			expiresAt: invitation.expiresAt,
			lastSentAt: invitation.lastSentAt
		}));
	});
}

/**
 * Invite d'un coup une liste de pharmacies (déjà lue par `parseInvitationList`).
 * Tout ou rien face au quota : si la liste dépasse les places libres, rien ne part.
 */
export async function invitePharmacies(
	groupId: string,
	invitationEntries: readonly InvitationListEntry[]
): Promise<PharmacyInvitationsSending> {
	if (invitationEntries.length === 0) return { isSent: false, failureMessage: 'Indiquez au moins un email.' };

	return runWithGroupAccess({ groupId }, async (transaction) => {
		const group = await findGroup(transaction, groupId);
		const now = new Date();
		const skippedEmails = await findEmailsAlreadyInvited(transaction, groupId, invitationEntries, now);
		const entriesToInvite = invitationEntries.filter(
			(entry) => !skippedEmails.some((skippedEmail) => skippedEmail.email === entry.email)
		);

		const freePlaces = group.pharmacyQuota - (await countUsedPlaces(transaction, groupId));
		if (entriesToInvite.length > freePlaces) {
			return {
				isSent: false,
				failureMessage: `Il reste ${Math.max(freePlaces, 0)} place(s) dans votre quota de ${group.pharmacyQuota} pharmacies : retirez ${entriesToInvite.length - freePlaces} invitation(s) ou contactez Crystal Pharm pour l’augmenter.`
			};
		}

		const sentInvitations: SentPharmacyInvitation[] = [];
		for (const entry of entriesToInvite) {
			const invitationToken = generateInvitationToken();
			await transaction.insert(pharmacyInvitations).values({
				id: crypto.randomUUID(),
				groupId,
				email: entry.email,
				pharmacyName: entry.pharmacyName ?? null,
				tokenHash: hashInvitationToken(invitationToken),
				expiresAt: computeInvitationExpiry(now),
				lastSentAt: now
			});
			sentInvitations.push({ email: entry.email, pharmacyName: entry.pharmacyName, invitationToken, groupName: group.name });
		}
		return { isSent: true, sentInvitations, skippedEmails };
	});
}

/** Un nouveau lien, qui remplace l'ancien et repart pour toute la durée de validité. */
export async function renewPharmacyInvitation(
	groupId: string,
	invitationId: string
): Promise<SentPharmacyInvitation | undefined> {
	return runWithGroupAccess({ groupId }, async (transaction) => {
		const group = await findGroup(transaction, groupId);
		const now = new Date();
		const invitationToken = generateInvitationToken();
		const [renewedInvitation] = await transaction
			.update(pharmacyInvitations)
			.set({ tokenHash: hashInvitationToken(invitationToken), expiresAt: computeInvitationExpiry(now), lastSentAt: now })
			.where(
				and(
					eq(pharmacyInvitations.id, invitationId),
					eq(pharmacyInvitations.groupId, groupId),
					isNull(pharmacyInvitations.acceptedAt),
					isNull(pharmacyInvitations.declinedAt),
					isNull(pharmacyInvitations.revokedAt)
				)
			)
			.returning();
		if (!renewedInvitation) return undefined;
		return {
			email: renewedInvitation.email,
			pharmacyName: renewedInvitation.pharmacyName ?? undefined,
			invitationToken,
			groupName: group.name
		};
	});
}

export async function revokePharmacyInvitation(groupId: string, invitationId: string): Promise<void> {
	await runWithGroupAccess({ groupId }, (transaction) =>
		transaction
			.update(pharmacyInvitations)
			.set({ revokedAt: new Date() })
			.where(and(eq(pharmacyInvitations.id, invitationId), eq(pharmacyInvitations.groupId, groupId)))
	);
}

/** Les invitations en attente adressées à l'email de ce compte. */
export function listPendingInvitationsForAccountEmail(accountEmail: string): Promise<PharmacyInvitationForPharmacy[]> {
	const email = accountEmail.toLowerCase();
	return runWithGroupAccess({ accountEmail: email }, async (transaction) => {
		const invitations = await selectInvitationsForPharmacy(transaction).where(
			and(eq(pharmacyInvitations.email, email), ...pendingInvitationConditions(new Date()))
		);
		return invitations.map(toInvitationForPharmacy);
	});
}

export async function findPharmacyInvitation(proof: InvitationProof): Promise<PharmacyInvitationForPharmacy | undefined> {
	return runWithGroupAccess(toInvitationAccess(proof), async (transaction) => {
		const [invitation] = await selectInvitationsForPharmacy(transaction).where(toInvitationCondition(proof));
		return invitation ? toInvitationForPharmacy(invitation) : undefined;
	});
}

/** La pharmacie accepte : le groupement voit désormais ses données et prend en charge ce que prévoit son contrat. */
export async function acceptPharmacyInvitation(tenantId: string, proof: InvitationProof): Promise<PharmacyInvitationAnswer> {
	return runWithGroupAccess({ ...toInvitationAccess(proof), tenantId }, async (transaction) => {
		const [invitation] = await transaction.select().from(pharmacyInvitations).where(toInvitationCondition(proof));
		if (!invitation) return { isAnswered: false, failureMessage: 'Cette invitation n’existe pas.' };

		const status = describeInvitationStatus(invitation, new Date());
		if (status !== 'pending') return { isAnswered: false, failureMessage: invitationUnavailableMessages[status] };

		const [currentMembership] = await transaction
			.select({ groupName: pharmacyGroups.name })
			.from(pharmacyMemberships)
			.innerJoin(pharmacyGroups, eq(pharmacyGroups.id, pharmacyMemberships.groupId))
			.where(and(eq(pharmacyMemberships.tenantId, tenantId), isNull(pharmacyMemberships.leftAt)));
		if (currentMembership) {
			return {
				isAnswered: false,
				failureMessage: `Votre pharmacie est déjà membre de ${currentMembership.groupName}. Quittez-le d’abord depuis « Pharmacie ».`
			};
		}

		const now = new Date();
		await transaction.insert(pharmacyMemberships).values({
			id: crypto.randomUUID(),
			tenantId,
			groupId: invitation.groupId,
			joinedAt: now
		});
		await transaction
			.update(pharmacyInvitations)
			.set({ acceptedAt: now, acceptedTenantId: tenantId })
			.where(eq(pharmacyInvitations.id, invitation.id));
		return { isAnswered: true, groupId: invitation.groupId };
	});
}

export async function declinePharmacyInvitation(proof: InvitationProof): Promise<PharmacyInvitationAnswer> {
	return runWithGroupAccess(toInvitationAccess(proof), async (transaction) => {
		const [declinedInvitation] = await transaction
			.update(pharmacyInvitations)
			.set({ declinedAt: new Date() })
			.where(and(toInvitationCondition(proof), ...pendingInvitationConditions(new Date())))
			.returning();
		if (!declinedInvitation) return { isAnswered: false, failureMessage: 'Cette invitation n’est plus en attente.' };
		return { isAnswered: true, groupId: declinedInvitation.groupId };
	});
}

/** L'accès qui ouvre une invitation : son jeton, ou l'email du compte invité. */
export function toInvitationAccess(proof: InvitationProof): GroupAccess {
	return 'invitationToken' in proof
		? { invitationTokenHash: hashInvitationToken(proof.invitationToken) }
		: { accountEmail: proof.accountEmail };
}

function toInvitationCondition(proof: InvitationProof) {
	return 'invitationToken' in proof
		? eq(pharmacyInvitations.tokenHash, hashInvitationToken(proof.invitationToken))
		: and(eq(pharmacyInvitations.id, proof.invitationId), eq(pharmacyInvitations.email, proof.accountEmail.toLowerCase()));
}

function selectInvitationsForPharmacy(transaction: GroupTransaction) {
	return transaction
		.select({ invitation: pharmacyInvitations, groupName: pharmacyGroups.name })
		.from(pharmacyInvitations)
		.innerJoin(pharmacyGroups, eq(pharmacyGroups.id, pharmacyInvitations.groupId))
		.$dynamic();
}

function toInvitationForPharmacy({
	invitation,
	groupName
}: {
	invitation: typeof pharmacyInvitations.$inferSelect;
	groupName: string;
}): PharmacyInvitationForPharmacy {
	return {
		invitationId: invitation.id,
		groupId: invitation.groupId,
		groupName,
		email: invitation.email,
		status: describeInvitationStatus(invitation, new Date()),
		expiresAt: invitation.expiresAt
	};
}

async function findGroup(transaction: GroupTransaction, groupId: string) {
	const [group] = await transaction.select().from(pharmacyGroups).where(eq(pharmacyGroups.id, groupId));
	if (!group) throw new Error(`The pharmacy group ${groupId} does not exist.`);
	return group;
}

async function findEmailsAlreadyInvited(
	transaction: GroupTransaction,
	groupId: string,
	invitationEntries: readonly InvitationListEntry[],
	now: Date
): Promise<SkippedInvitationEmail[]> {
	const pendingInvitations = await transaction
		.select({ email: pharmacyInvitations.email })
		.from(pharmacyInvitations)
		.where(and(eq(pharmacyInvitations.groupId, groupId), ...pendingInvitationConditions(now)));
	const pendingEmails = new Set(pendingInvitations.map((invitation) => invitation.email));
	return invitationEntries
		.filter((entry) => pendingEmails.has(entry.email))
		.map((entry) => ({ email: entry.email, reason: 'déjà invitée, en attente de réponse' }));
}

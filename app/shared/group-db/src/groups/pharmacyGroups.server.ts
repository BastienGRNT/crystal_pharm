import { collectFieldErrors, type FieldErrors, type SaveResult } from '@crystal-pharm/pharmacy-db/domain';
import { and, asc, count, eq, gt, isNull } from 'drizzle-orm';
import * as v from 'valibot';
import { platformAccess, runWithGroupAccess, type GroupTransaction } from '../database/groupDatabase.server';
import { pharmacyGroups, pharmacyInvitations, pharmacyMemberships } from '../database/groupTables';
import {
	PharmacyGroupDetailsSchema,
	type PharmacyGroupDetailsFieldName,
	type PharmacyGroupDetailsInput
} from './pharmacyGroupDetails';
import { discardAllImagesOfPharmacyGroup } from './profile/pharmacyGroupImageFiles.server';

export type PharmacyGroupSummary = {
	groupId: string;
	name: string;
	contactEmail: string | undefined;
	pharmacyQuota: number;
	memberPharmacyCount: number;
	pendingInvitationCount: number;
	createdAt: Date;
};

export type PharmacyGroupCreationResult =
	| { isSaved: true; groupId: string }
	| { isSaved: false; fieldErrors: FieldErrors<PharmacyGroupDetailsFieldName> };

/** Un groupement naît dans `admin`, jamais d'une inscription. */
export async function createPharmacyGroup(detailsInput: PharmacyGroupDetailsInput): Promise<PharmacyGroupCreationResult> {
	const validation = v.safeParse(PharmacyGroupDetailsSchema, detailsInput);
	if (!validation.success) return { isSaved: false, fieldErrors: collectFieldErrors(validation.issues) };

	const groupId = crypto.randomUUID();
	await runWithGroupAccess(platformAccess, (transaction) =>
		transaction.insert(pharmacyGroups).values({
			id: groupId,
			name: validation.output.name,
			contactEmail: validation.output.contactEmail ?? null,
			pharmacyQuota: validation.output.pharmacyQuota
		})
	);
	return { isSaved: true, groupId };
}

export async function updatePharmacyGroup(
	groupId: string,
	detailsInput: PharmacyGroupDetailsInput
): Promise<SaveResult<PharmacyGroupDetailsFieldName>> {
	const validation = v.safeParse(PharmacyGroupDetailsSchema, detailsInput);
	if (!validation.success) return { isSaved: false, fieldErrors: collectFieldErrors(validation.issues) };

	return runWithGroupAccess(platformAccess, async (transaction) => {
		const usedPlaces = await countUsedPlaces(transaction, groupId);
		if (validation.output.pharmacyQuota < usedPlaces) {
			return {
				isSaved: false,
				fieldErrors: {
					pharmacyQuota: `Le groupement occupe déjà ${usedPlaces} places (membres et invitations en attente).`
				}
			};
		}
		await transaction
			.update(pharmacyGroups)
			.set({
				name: validation.output.name,
				contactEmail: validation.output.contactEmail ?? null,
				pharmacyQuota: validation.output.pharmacyQuota
			})
			.where(eq(pharmacyGroups.id, groupId));
		return { isSaved: true };
	});
}

export function listPharmacyGroupsForPlatform(): Promise<PharmacyGroupSummary[]> {
	return runWithGroupAccess(platformAccess, async (transaction) => {
		const groups = await transaction.select().from(pharmacyGroups).orderBy(asc(pharmacyGroups.name));
		return Promise.all(groups.map((group) => summarizePharmacyGroup(transaction, group)));
	});
}

export function getPharmacyGroupForPlatform(groupId: string): Promise<PharmacyGroupSummary | undefined> {
	return runWithGroupAccess(platformAccess, (transaction) => findPharmacyGroupSummary(transaction, groupId));
}

/** Le groupement vu par l'un de ses GroupMembers. */
export async function getPharmacyGroup(groupId: string): Promise<PharmacyGroupSummary> {
	const groupSummary = await runWithGroupAccess({ groupId }, (transaction) =>
		findPharmacyGroupSummary(transaction, groupId)
	);
	if (!groupSummary) throw new Error(`The pharmacy group ${groupId} does not exist.`);
	return groupSummary;
}

/** Supprime le groupement, ses images et tout ce qui en dépend (outil de dev). */
export async function deletePharmacyGroup(groupId: string): Promise<void> {
	await runWithGroupAccess(platformAccess, (transaction) =>
		transaction.delete(pharmacyGroups).where(eq(pharmacyGroups.id, groupId))
	);
	await discardAllImagesOfPharmacyGroup(groupId);
}

export function listPharmacyGroupIdsNamed(groupNames: readonly string[]): Promise<string[]> {
	return runWithGroupAccess(platformAccess, async (transaction) => {
		const groups = await transaction.select({ id: pharmacyGroups.id, name: pharmacyGroups.name }).from(pharmacyGroups);
		return groups.filter((group) => groupNames.includes(group.name)).map((group) => group.id);
	});
}

async function findPharmacyGroupSummary(
	transaction: GroupTransaction,
	groupId: string
): Promise<PharmacyGroupSummary | undefined> {
	const [group] = await transaction.select().from(pharmacyGroups).where(eq(pharmacyGroups.id, groupId));
	return group ? summarizePharmacyGroup(transaction, group) : undefined;
}

async function summarizePharmacyGroup(
	transaction: GroupTransaction,
	group: typeof pharmacyGroups.$inferSelect
): Promise<PharmacyGroupSummary> {
	return {
		groupId: group.id,
		name: group.name,
		contactEmail: group.contactEmail ?? undefined,
		pharmacyQuota: group.pharmacyQuota,
		memberPharmacyCount: await countMemberPharmacies(transaction, group.id),
		pendingInvitationCount: await countPendingInvitations(transaction, group.id),
		createdAt: group.createdAt
	};
}

/** Les places prises dans le quota : les pharmacies membres et les invitations en attente. */
export async function countUsedPlaces(transaction: GroupTransaction, groupId: string): Promise<number> {
	return (await countMemberPharmacies(transaction, groupId)) + (await countPendingInvitations(transaction, groupId));
}

async function countMemberPharmacies(transaction: GroupTransaction, groupId: string): Promise<number> {
	const [result] = await transaction
		.select({ value: count() })
		.from(pharmacyMemberships)
		.where(and(eq(pharmacyMemberships.groupId, groupId), isNull(pharmacyMemberships.leftAt)));
	return result?.value ?? 0;
}

async function countPendingInvitations(transaction: GroupTransaction, groupId: string): Promise<number> {
	const [result] = await transaction
		.select({ value: count() })
		.from(pharmacyInvitations)
		.where(
			and(
				eq(pharmacyInvitations.groupId, groupId),
				isNull(pharmacyInvitations.acceptedAt),
				isNull(pharmacyInvitations.declinedAt),
				isNull(pharmacyInvitations.revokedAt),
				gt(pharmacyInvitations.expiresAt, new Date())
			)
		);
	return result?.value ?? 0;
}

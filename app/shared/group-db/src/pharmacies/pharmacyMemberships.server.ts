import { listTenantSummaries, type TenantSummary } from '@crystal-pharm/pharmacy-db';
import { and, desc, eq, gt, isNull, or, sql } from 'drizzle-orm';
import { platformAccess, runWithGroupAccess, type GroupAccess, type GroupTransaction } from '../database/groupDatabase.server';
import { pharmacyGroups, pharmacyMemberships, type MembershipEndedBy } from '../database/groupTables';
import { computeCoverageEnd } from './coveragePeriod';

/** Le groupement d'une pharmacie, vu par la pharmacie. */
export type CurrentGroupOfTenant = {
	membershipId: string;
	groupId: string;
	groupName: string;
	joinedAt: Date;
};

/**
 * Le groupement qui prend en charge les Tools de la pharmacie : celui dont elle
 * est membre, ou celui qu'elle vient de quitter jusqu'à la fin du mois.
 */
export type CoveringGroupOfTenant = {
	groupId: string;
	groupName: string;
	/** `undefined` tant que la pharmacie est membre. */
	coverageEndsAt: Date | undefined;
};

export type MemberPharmacy = TenantSummary & { membershipId: string; joinedAt: Date };

export async function findCurrentGroupOfTenant(tenantId: string): Promise<CurrentGroupOfTenant | undefined> {
	const [membership] = await runWithGroupAccess({ tenantId }, (transaction) =>
		transaction
			.select({
				membershipId: pharmacyMemberships.id,
				groupId: pharmacyMemberships.groupId,
				groupName: pharmacyGroups.name,
				joinedAt: pharmacyMemberships.joinedAt
			})
			.from(pharmacyMemberships)
			.innerJoin(pharmacyGroups, eq(pharmacyGroups.id, pharmacyMemberships.groupId))
			.where(and(eq(pharmacyMemberships.tenantId, tenantId), isNull(pharmacyMemberships.leftAt)))
	);
	return membership;
}

/** Pour qui a déjà une transaction ouverte : en ouvrir une deuxième bloquerait le pool de connexions. */
export async function readCoveringGroupOfTenant(
	transaction: GroupTransaction,
	tenantId: string,
	now: Date
): Promise<CoveringGroupOfTenant | undefined> {
	const coveringMemberships = await transaction
		.select({
			groupId: pharmacyMemberships.groupId,
			groupName: pharmacyGroups.name,
			leftAt: pharmacyMemberships.leftAt,
			coverageEndsAt: pharmacyMemberships.coverageEndsAt
		})
		.from(pharmacyMemberships)
		.innerJoin(pharmacyGroups, eq(pharmacyGroups.id, pharmacyMemberships.groupId))
		.where(and(eq(pharmacyMemberships.tenantId, tenantId), isCoveringAt(now)))
		.orderBy(desc(pharmacyMemberships.joinedAt));
	const coveringMembership =
		coveringMemberships.find((membership) => membership.leftAt === null) ?? coveringMemberships[0];
	if (!coveringMembership) return undefined;
	return {
		groupId: coveringMembership.groupId,
		groupName: coveringMembership.groupName,
		coverageEndsAt: coveringMembership.leftAt === null ? undefined : (coveringMembership.coverageEndsAt ?? undefined)
	};
}

/** Les pharmacies membres, avec ce que leur site affiche déjà (nom, ville). */
export async function listMemberPharmacies(access: GroupAccess, groupId: string): Promise<MemberPharmacy[]> {
	const memberships = await listCurrentMemberships(access, groupId);
	const tenantSummaries = await listTenantSummaries(memberships.map((membership) => membership.tenantId));
	return tenantSummaries.flatMap((tenantSummary) => {
		const membership = memberships.find((candidate) => candidate.tenantId === tenantSummary.tenantId);
		return membership ? [{ ...tenantSummary, membershipId: membership.membershipId, joinedAt: membership.joinedAt }] : [];
	});
}

/** Les Tenants dont le groupement prend en charge les Tools aujourd'hui (membres ou partis ce mois-ci). */
export function listCoveredTenantIdsOfGroup(access: GroupAccess, groupId: string, now: Date): Promise<string[]> {
	return runWithGroupAccess(access, async (transaction) => {
		const memberships = await transaction
			.select({ tenantId: pharmacyMemberships.tenantId })
			.from(pharmacyMemberships)
			.where(and(eq(pharmacyMemberships.groupId, groupId), isCoveringAt(now)));
		return [...new Set(memberships.map((membership) => membership.tenantId))];
	});
}

/**
 * La pharmacie quitte son groupement ; la prise en charge court jusqu'à la fin du mois.
 * Pour `billing-db`, qui doit refaire les accès de la pharmacie dans la même transaction.
 */
export function leaveGroupInTransaction(
	transaction: GroupTransaction,
	tenantId: string
): Promise<CoveringGroupOfTenant | undefined> {
	return endMembership(transaction, eq(pharmacyMemberships.tenantId, tenantId), 'pharmacy');
}

/**
 * Le groupement retire une de ses pharmacies ; la prise en charge court jusqu'à la fin du mois.
 * Pour `billing-db`, qui doit refaire les accès de la pharmacie dans la même transaction.
 */
export function removePharmacyFromGroupInTransaction(
	transaction: GroupTransaction,
	groupId: string,
	membershipId: string
): Promise<(CoveringGroupOfTenant & { tenantId: string }) | undefined> {
	return endMembership(
		transaction,
		and(eq(pharmacyMemberships.id, membershipId), eq(pharmacyMemberships.groupId, groupId)),
		'group'
	);
}

/** Outil de dev : la prise en charge d'un départ s'arrête tout de suite, sans attendre la fin du mois. */
export async function endCoverageNow(tenantId: string): Promise<void> {
	await runWithGroupAccess(platformAccess, (transaction) =>
		transaction
			.update(pharmacyMemberships)
			.set({ coverageEndsAt: new Date() })
			.where(and(eq(pharmacyMemberships.tenantId, tenantId), gt(pharmacyMemberships.coverageEndsAt, new Date())))
	);
}

/** Outil de dev : fait comme si un mois était passé pour les adhésions (avec `billing-db`). */
export async function shiftGroupDatesBackOneMonth(): Promise<void> {
	await runWithGroupAccess(platformAccess, async (transaction) => {
		// Le mois recule sur le calendrier du serveur, comme `computeCoverageEnd`.
		await transaction.execute(sql`select set_config('timezone', ${Intl.DateTimeFormat().resolvedOptions().timeZone}, true)`);
		await transaction.execute(
			sql.raw(
				`update groups.pharmacy_memberships set joined_at = joined_at - interval '1 month', left_at = left_at - interval '1 month', coverage_ends_at = coverage_ends_at - interval '1 month'`
			)
		);
	});
}

async function endMembership(
	transaction: GroupTransaction,
	membershipCondition: ReturnType<typeof and>,
	endedBy: MembershipEndedBy
): Promise<(CoveringGroupOfTenant & { tenantId: string }) | undefined> {
	const now = new Date();
	const coverageEndsAt = computeCoverageEnd(now);
	const [endedMembership] = await transaction
		.update(pharmacyMemberships)
		.set({ leftAt: now, coverageEndsAt, endedBy })
		.where(and(membershipCondition, isNull(pharmacyMemberships.leftAt)))
		.returning();
	if (!endedMembership) return undefined;
	const [group] = await transaction
		.select({ name: pharmacyGroups.name })
		.from(pharmacyGroups)
		.where(eq(pharmacyGroups.id, endedMembership.groupId));
	return {
		tenantId: endedMembership.tenantId,
		groupId: endedMembership.groupId,
		groupName: group?.name ?? '',
		coverageEndsAt
	};
}

/** Membre, ou parti avec une prise en charge qui court encore. */
function isCoveringAt(now: Date) {
	return or(isNull(pharmacyMemberships.leftAt), gt(pharmacyMemberships.coverageEndsAt, now));
}

function listCurrentMemberships(access: GroupAccess, groupId: string) {
	return runWithGroupAccess(access, (transaction) =>
		transaction
			.select({
				membershipId: pharmacyMemberships.id,
				tenantId: pharmacyMemberships.tenantId,
				joinedAt: pharmacyMemberships.joinedAt
			})
			.from(pharmacyMemberships)
			.where(and(eq(pharmacyMemberships.groupId, groupId), isNull(pharmacyMemberships.leftAt)))
	);
}

import { listTenantSummaries, type TenantSummary } from '@crystal-pharm/pharmacy-db';
import { and, desc, eq, gt, isNull, or } from 'drizzle-orm';
import { platformAccess, runWithGroupAccess, type GroupAccess } from '../database/groupDatabase.server';
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

export async function findCoveringGroupOfTenant(tenantId: string, now: Date): Promise<CoveringGroupOfTenant | undefined> {
	const coveringMemberships = await runWithGroupAccess({ tenantId }, (transaction) =>
		transaction
			.select({
				groupId: pharmacyMemberships.groupId,
				groupName: pharmacyGroups.name,
				leftAt: pharmacyMemberships.leftAt,
				coverageEndsAt: pharmacyMemberships.coverageEndsAt
			})
			.from(pharmacyMemberships)
			.innerJoin(pharmacyGroups, eq(pharmacyGroups.id, pharmacyMemberships.groupId))
			.where(
				and(
					eq(pharmacyMemberships.tenantId, tenantId),
					or(isNull(pharmacyMemberships.leftAt), gt(pharmacyMemberships.coverageEndsAt, now))
				)
			)
			.orderBy(desc(pharmacyMemberships.joinedAt))
	);
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
			.where(
				and(
					eq(pharmacyMemberships.groupId, groupId),
					or(isNull(pharmacyMemberships.leftAt), gt(pharmacyMemberships.coverageEndsAt, now))
				)
			);
		return [...new Set(memberships.map((membership) => membership.tenantId))];
	});
}

/** La pharmacie quitte son groupement ; la prise en charge court jusqu'à la fin du mois. */
export async function leaveGroup(tenantId: string): Promise<CoveringGroupOfTenant | undefined> {
	return endMembership({ tenantId }, and(eq(pharmacyMemberships.tenantId, tenantId)), 'pharmacy');
}

/** Le groupement retire une de ses pharmacies ; la prise en charge court jusqu'à la fin du mois. */
export async function removePharmacyFromGroup(groupId: string, membershipId: string): Promise<CoveringGroupOfTenant | undefined> {
	return endMembership(
		{ groupId },
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

async function endMembership(
	access: GroupAccess,
	membershipCondition: ReturnType<typeof and>,
	endedBy: MembershipEndedBy
): Promise<CoveringGroupOfTenant | undefined> {
	const now = new Date();
	const coverageEndsAt = computeCoverageEnd(now);
	return runWithGroupAccess(access, async (transaction) => {
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
		return { groupId: endedMembership.groupId, groupName: group?.name ?? '', coverageEndsAt };
	});
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

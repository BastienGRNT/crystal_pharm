import { users } from '@crystal-pharm/auth/customer-tables';
import { and, asc, eq, sql } from 'drizzle-orm';
import { runAsAccount, runAsTenant, type PharmacyTransaction } from '../database/pharmacyDatabase.server';
import { tenantMemberships, tenants } from '../database/pharmacyTables';
import { keepKnownResponsibilityKeys, type ResponsibilityKey } from './responsibilities';
import { describeTenantMemberAccess, type TenantMemberAccess, type TenantMemberKind } from './tenantMemberAccess';

/** Un compte de l'équipe, tel que l'Owner le voit en gérant les accès. */
export type TenantMember = {
	accountId: string;
	name: string;
	/** `undefined` pour le CounterAccount, qui n'en a pas. */
	email: string | undefined;
	/** L'identifiant du CounterAccount. */
	username: string | undefined;
	memberKind: TenantMemberKind;
	responsibilityKeys: readonly ResponsibilityKey[];
	employeeId: string | undefined;
	joinedAt: Date;
};

export type TenantMemberChange = { isChanged: true } | { isChanged: false; failureMessage: string };

const missingMemberChange: TenantMemberChange = { isChanged: false, failureMessage: 'Ce compte ne fait plus partie de la pharmacie.' };
const lastOwnerChange: TenantMemberChange = {
	isChanged: false,
	failureMessage: 'La pharmacie doit garder au moins un titulaire : nommez-en un autre avant.'
};

/** Ce que le compte peut faire dans son Tenant actif ; `undefined` s'il n'a encore aucune pharmacie. */
export async function findActiveTenantMemberAccess(accountId: string): Promise<TenantMemberAccess | undefined> {
	// Tant que le sélecteur de pharmacie n'existe pas, le Tenant actif est le premier rejoint.
	const [firstMembership] = await runAsAccount(accountId, (transaction) =>
		transaction
			.select()
			.from(tenantMemberships)
			.where(eq(tenantMemberships.accountId, accountId))
			.orderBy(asc(tenantMemberships.createdAt))
			.limit(1)
	);
	return firstMembership && describeTenantMemberAccess(firstMembership);
}

/** Les Owners d'abord, puis l'équipe, puis le CounterAccount. */
export async function listTenantMembers(tenantId: string): Promise<TenantMember[]> {
	const memberRows = await runAsTenant(tenantId, (transaction) =>
		transaction
			.select({ membership: tenantMemberships, user: users })
			.from(tenantMemberships)
			.innerJoin(users, eq(users.id, tenantMemberships.accountId))
			.where(eq(tenantMemberships.tenantId, tenantId))
			.orderBy(asc(tenantMemberships.createdAt))
	);
	const memberKindOrder: TenantMemberKind[] = ['owner', 'employee', 'counter'];
	return memberRows
		.map(({ membership, user }) => {
			const access = describeTenantMemberAccess(membership);
			return {
				accountId: membership.accountId,
				name: user.name,
				email: membership.memberKind === 'counter' ? undefined : user.email,
				username: user.username ?? undefined,
				memberKind: access.memberKind,
				responsibilityKeys: access.responsibilityKeys,
				employeeId: access.employeeId,
				joinedAt: membership.createdAt
			};
		})
		.sort((first, second) => memberKindOrder.indexOf(first.memberKind) - memberKindOrder.indexOf(second.memberKind));
}

/** Un Owner les a toutes : on ne choisit les Responsibilities que des autres comptes. */
export function updateTenantMemberResponsibilities(
	tenantId: string,
	accountId: string,
	responsibilityKeyInputs: readonly string[]
): Promise<TenantMemberChange> {
	return runAsTenant(tenantId, async (transaction) => {
		const membership = await findMembershipForUpdate(transaction, tenantId, accountId);
		if (!membership) return missingMemberChange;
		if (membership.memberKind === 'owner') {
			return { isChanged: false, failureMessage: 'Un titulaire a déjà toutes les responsabilités.' };
		}
		await transaction
			.update(tenantMemberships)
			.set({ responsibilityKeys: keepKnownResponsibilityKeys(responsibilityKeyInputs) })
			.where(membershipOf(tenantId, accountId));
		return { isChanged: true };
	});
}

/** Le compte devient Owner : tous les droits, abonnement et accès compris. */
export function appointTenantOwner(tenantId: string, accountId: string): Promise<TenantMemberChange> {
	return runAsTenant(tenantId, async (transaction) => {
		const membership = await findMembershipForUpdate(transaction, tenantId, accountId);
		if (!membership) return missingMemberChange;
		if (membership.memberKind === 'counter') {
			return { isChanged: false, failureMessage: 'Le compte comptoir est partagé : il ne peut pas être titulaire.' };
		}
		await transaction.update(tenantMemberships).set({ memberKind: 'owner' }).where(membershipOf(tenantId, accountId));
		return { isChanged: true };
	});
}

/** L'Owner redevient un membre de l'équipe, sans Responsibility tant qu'on ne lui en donne pas. */
export function withdrawTenantOwnership(tenantId: string, accountId: string): Promise<TenantMemberChange> {
	return runAsTenant(tenantId, async (transaction) => {
		const membership = await findMembershipForUpdate(transaction, tenantId, accountId);
		if (!membership || membership.memberKind !== 'owner') return missingMemberChange;
		if (await isLastOwner(transaction, tenantId)) return lastOwnerChange;
		await transaction
			.update(tenantMemberships)
			.set({ memberKind: 'employee', responsibilityKeys: [] })
			.where(membershipOf(tenantId, accountId));
		return { isChanged: true };
	});
}

/**
 * Retire l'appartenance du compte, sans toucher au compte lui-même (cf.
 * `removeTenantMember`, qui efface en plus le CounterAccount). Renvoie le type retiré.
 */
export function detachTenantMembership(
	tenantId: string,
	accountId: string
): Promise<TenantMemberChange & { removedMemberKind?: TenantMemberKind }> {
	return runAsTenant(tenantId, async (transaction) => {
		const membership = await findMembershipForUpdate(transaction, tenantId, accountId);
		if (!membership) return missingMemberChange;
		if (membership.memberKind === 'owner' && (await isLastOwner(transaction, tenantId))) return lastOwnerChange;
		await transaction.delete(tenantMemberships).where(membershipOf(tenantId, accountId));
		return { isChanged: true, removedMemberKind: membership.memberKind };
	});
}

function membershipOf(tenantId: string, accountId: string) {
	return and(eq(tenantMemberships.tenantId, tenantId), eq(tenantMemberships.accountId, accountId));
}

// Verrouille la fiche du Tenant : deux Owners qui se retirent en même temps ne
// peuvent pas laisser la pharmacie sans aucun Owner.
async function findMembershipForUpdate(transaction: PharmacyTransaction, tenantId: string, accountId: string) {
	await transaction.select({ id: tenants.id }).from(tenants).where(eq(tenants.id, tenantId)).for('update');
	const [membership] = await transaction.select().from(tenantMemberships).where(membershipOf(tenantId, accountId));
	return membership;
}

async function isLastOwner(transaction: PharmacyTransaction, tenantId: string): Promise<boolean> {
	const [{ ownerCount } = { ownerCount: 0 }] = await transaction
		.select({ ownerCount: sql<number>`count(*)::int` })
		.from(tenantMemberships)
		.where(and(eq(tenantMemberships.tenantId, tenantId), eq(tenantMemberships.memberKind, 'owner')));
	return ownerCount <= 1;
}

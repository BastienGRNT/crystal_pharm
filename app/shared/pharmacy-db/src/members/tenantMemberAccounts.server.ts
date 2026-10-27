import {
	changeCounterAccountPassword,
	createCounterAccount,
	deleteCounterAccount,
	type CounterAccountPasswordChange
} from '@crystal-pharm/auth';
import { and, eq } from 'drizzle-orm';
import { runAsTenant } from '../database/pharmacyDatabase.server';
import { tenantMemberships } from '../database/pharmacyTables';
import { keepKnownResponsibilityKeys } from './responsibilities';
import { detachTenantMembership, type TenantMemberChange } from './tenantMembers.server';

export type CounterAccountCreationResult =
	| { isCreated: true; username: string }
	| { isCreated: false; field: 'username' | 'password' | 'form'; failureMessage: string };

const counterAccountDisplayName = 'Comptoir';

/** Crée le CounterAccount du Tenant (un seul), avec les Responsibilities choisies. */
export async function createCounterAccountOfTenant(
	tenantId: string,
	{
		usernameInput,
		password,
		responsibilityKeyInputs
	}: { usernameInput: string; password: string; responsibilityKeyInputs: readonly string[] }
): Promise<CounterAccountCreationResult> {
	if (await findCounterAccountIdOfTenant(tenantId)) {
		return { isCreated: false, field: 'form', failureMessage: 'La pharmacie a déjà un compte comptoir.' };
	}
	const creation = await createCounterAccount({ usernameInput, password, displayName: counterAccountDisplayName });
	if (!creation.isCreated) return creation;

	try {
		await runAsTenant(tenantId, (transaction) =>
			transaction.insert(tenantMemberships).values({
				tenantId,
				accountId: creation.accountId,
				memberKind: 'counter',
				responsibilityKeys: keepKnownResponsibilityKeys(responsibilityKeyInputs)
			})
		);
	} catch (membershipFailure) {
		// Un second CounterAccount créé au même instant : l'index unique refuse l'appartenance,
		// et le compte, qui n'appartiendrait à aucune pharmacie, est effacé.
		await deleteCounterAccount(creation.accountId);
		throw membershipFailure;
	}
	return { isCreated: true, username: creation.username };
}

export async function changeCounterAccountPasswordOfTenant(
	tenantId: string,
	password: string
): Promise<CounterAccountPasswordChange> {
	const counterAccountId = await findCounterAccountIdOfTenant(tenantId);
	if (!counterAccountId) return { isChanged: false, failureMessage: 'La pharmacie n’a pas de compte comptoir.' };
	return changeCounterAccountPassword(counterAccountId, password);
}

/**
 * Retire le compte de la pharmacie : un Owner ou un Employee garde son compte (et ses
 * autres pharmacies) ; le CounterAccount, qui n'appartient qu'à elle, est effacé.
 */
export async function removeTenantMember(tenantId: string, accountId: string): Promise<TenantMemberChange> {
	const removal = await detachTenantMembership(tenantId, accountId);
	if (removal.isChanged && removal.removedMemberKind === 'counter') await deleteCounterAccount(accountId);
	return removal;
}

export async function findCounterAccountIdOfTenant(tenantId: string): Promise<string | undefined> {
	const [counterMembership] = await runAsTenant(tenantId, (transaction) =>
		transaction
			.select({ accountId: tenantMemberships.accountId })
			.from(tenantMemberships)
			.where(and(eq(tenantMemberships.tenantId, tenantId), eq(tenantMemberships.memberKind, 'counter')))
	);
	return counterMembership?.accountId;
}

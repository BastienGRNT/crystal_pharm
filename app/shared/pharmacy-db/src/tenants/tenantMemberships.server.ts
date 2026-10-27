import { users } from '@crystal-pharm/auth/customer-tables';
import { asc, eq } from 'drizzle-orm';
import * as v from 'valibot';
import {
	PharmacyContactDetailsSchema,
	type PharmacyContactDetailsFieldName,
	type PharmacyContactDetailsInput
} from '../contact-details/pharmacyContactDetails';
import { runAsAccount, runAsTenant } from '../database/pharmacyDatabase.server';
import { tenantMemberships, tenants } from '../database/pharmacyTables';
import { collectFieldErrors, type FieldErrors } from '../fieldErrors';
import { toContactDetailsColumns } from './pharmacyProfile.server';

export type TenantCreationResult =
	| { isSaved: true; tenantId: string }
	| { isSaved: false; fieldErrors: FieldErrors<PharmacyContactDetailsFieldName> };

/** Crée la pharmacie et en fait Owner le compte qui l'a créée. */
export async function createTenantForAccount(
	accountId: string,
	contactDetailsInput: PharmacyContactDetailsInput
): Promise<TenantCreationResult> {
	const validation = v.safeParse(PharmacyContactDetailsSchema, contactDetailsInput);
	if (!validation.success) return { isSaved: false, fieldErrors: collectFieldErrors(validation.issues) };

	// L'identifiant est choisi avant l'insertion : la Row-Level Security exige
	// que le Tenant soit posé dans la transaction qui l'écrit.
	const tenantId = crypto.randomUUID();
	await runAsTenant(tenantId, async (transaction) => {
		await transaction.insert(tenants).values({ id: tenantId, ...toContactDetailsColumns(validation.output) });
		await transaction.insert(tenantMemberships).values({ tenantId, accountId, memberKind: 'owner' });
	});
	return { isSaved: true, tenantId };
}

/** Le Tenant sur lequel le compte travaille ; `undefined` s'il n'a encore aucune pharmacie. */
export async function findActiveTenantIdOfAccount(accountId: string): Promise<string | undefined> {
	// Tant que le sélecteur de pharmacie n'existe pas, le Tenant actif est le premier rejoint.
	const [firstMembership] = await runAsAccount(accountId, (transaction) =>
		transaction
			.select({ tenantId: tenantMemberships.tenantId })
			.from(tenantMemberships)
			.where(eq(tenantMemberships.accountId, accountId))
			.orderBy(asc(tenantMemberships.createdAt))
			.limit(1)
	);
	return firstMembership?.tenantId;
}

/**
 * Les emails des titulaires du Tenant. Les Responsibilities n'existent pas
 * encore : tout compte membre du Tenant est un Owner, à restreindre le jour où
 * un Employee peut avoir son compte.
 */
export async function listOwnerEmailsOfTenant(tenantId: string): Promise<string[]> {
	const ownerRows = await runAsTenant(tenantId, (transaction) =>
		transaction
			.select({ email: users.email })
			.from(tenantMemberships)
			.innerJoin(users, eq(users.id, tenantMemberships.accountId))
			.where(eq(tenantMemberships.tenantId, tenantId))
			.orderBy(asc(tenantMemberships.createdAt))
	);
	return ownerRows.map((ownerRow) => ownerRow.email);
}

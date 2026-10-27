import { existsSync } from 'node:fs';
import postgres from 'postgres';
import { afterAll, describe, expect, it } from 'vitest';

// Se lance avec `pnpm --filter @crystal-pharm/pharmacy-db test:integration`,
// Postgres démarré (`make start`) et migré (`make migrate`).
const repositoryEnvironmentFile = new URL('../../../../../.env', import.meta.url);
if (existsSync(repositoryEnvironmentFile)) process.loadEnvFile(repositoryEnvironmentFile);

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is missing from the environment.');

const database = postgres(databaseUrl, { max: 1 });

// Comme `tenantIsolation` : un rôle ordinaire, endossé dans une transaction
// toujours annulée, car le compte de développement contourne la Row-Level Security.
const probeRoleName = 'pharmacy_member_isolation_probe';
const firstPharmacy = {
	tenantId: '00000000-0000-4000-8000-000000000011',
	accountId: 'member-probe-first-account',
	employeeId: '11111111-1111-4111-8111-000000000011',
	invitationId: '33333333-3333-4333-8333-000000000011',
	invitationTokenHash: 'member-probe-first-token-hash'
};
const secondPharmacy = {
	tenantId: '00000000-0000-4000-8000-000000000012',
	accountId: 'member-probe-second-account',
	employeeId: '11111111-1111-4111-8111-000000000012',
	invitationId: '33333333-3333-4333-8333-000000000012',
	invitationTokenHash: 'member-probe-second-token-hash'
};

class RollbackAfterTest extends Error {}

async function inRolledBackTransaction(test: (transaction: postgres.TransactionSql) => Promise<void>): Promise<void> {
	try {
		await database.begin(async (transaction) => {
			await insertTwoPharmaciesWithAnInvitation(transaction);
			await actAsOrdinaryRole(transaction);
			await test(transaction);
			throw new RollbackAfterTest();
		});
	} catch (error) {
		if (!(error instanceof RollbackAfterTest)) throw error;
	}
}

async function insertTwoPharmaciesWithAnInvitation(transaction: postgres.TransactionSql): Promise<void> {
	for (const pharmacy of [firstPharmacy, secondPharmacy]) {
		await transaction`insert into auth.users (id, name, email) values (${pharmacy.accountId}, ${pharmacy.accountId}, ${`${pharmacy.accountId}@example.test`})`;
		await transaction`insert into pharmacy.tenants (id, name, street, postal_code, city, phone_number)
			values (${pharmacy.tenantId}, ${pharmacy.tenantId}, '1 rue de la Paix', '75002', 'Paris', '0123456789')`;
		await transaction`insert into pharmacy.tenant_memberships (tenant_id, account_id, member_kind) values (${pharmacy.tenantId}, ${pharmacy.accountId}, 'owner')`;
		await transaction`insert into pharmacy.employees (id, tenant_id, first_name, last_name, job_title)
			values (${pharmacy.employeeId}, ${pharmacy.tenantId}, 'Camille', 'Fontaine', 'Préparatrice')`;
		await transaction`insert into pharmacy.tenant_member_invitations (id, tenant_id, employee_id, email, responsibility_keys, token_hash, expires_at)
			values (${pharmacy.invitationId}, ${pharmacy.tenantId}, ${pharmacy.employeeId}, 'camille@example.test', '{handle-appointments}',
				${pharmacy.invitationTokenHash}, now() + interval '14 days')`;
	}
}

async function actAsOrdinaryRole(transaction: postgres.TransactionSql): Promise<void> {
	await transaction.unsafe(`create role ${probeRoleName} nologin`);
	await transaction.unsafe(`grant usage on schema pharmacy, auth to ${probeRoleName}`);
	await transaction.unsafe(`grant select, insert, update, delete on all tables in schema pharmacy to ${probeRoleName}`);
	await transaction.unsafe(`set local role ${probeRoleName}`);
}

async function setActiveTenant(transaction: postgres.TransactionSql, tenantId: string): Promise<void> {
	await transaction`select set_config('app.tenant_id', ${tenantId}, true)`;
}

async function setInvitationTokenHash(transaction: postgres.TransactionSql, invitationTokenHash: string): Promise<void> {
	await transaction`select set_config('app.invitation_token_hash', ${invitationTokenHash}, true)`;
}

afterAll(async () => {
	await database.end();
});

describe('isolation des comptes et des invitations entre pharmacies', () => {
	it('ne montre que les invitations du Tenant actif', async () => {
		await inRolledBackTransaction(async (transaction) => {
			await setActiveTenant(transaction, firstPharmacy.tenantId);

			const visibleInvitations = await transaction`select id from pharmacy.tenant_member_invitations`;

			expect(visibleInvitations.map(({ id }) => id)).toEqual([firstPharmacy.invitationId]);
		});
	});

	it('ne montre au détenteur d’un jeton que son invitation, sans rien lui laisser écrire', async () => {
		await inRolledBackTransaction(async (transaction) => {
			await setInvitationTokenHash(transaction, secondPharmacy.invitationTokenHash);

			const visibleInvitations = await transaction`select id from pharmacy.tenant_member_invitations`;
			const visibleMemberships = await transaction`select account_id from pharmacy.tenant_memberships`;

			expect(visibleInvitations.map(({ id }) => id)).toEqual([secondPharmacy.invitationId]);
			expect(visibleMemberships).toHaveLength(0);
			await expect(
				transaction`insert into pharmacy.tenant_memberships (tenant_id, account_id, member_kind)
					values (${secondPharmacy.tenantId}, ${firstPharmacy.accountId}, 'owner')`
			).rejects.toThrow(/row-level security/);
		});
	});

	it('n’annule ni ne modifie l’invitation d’un autre Tenant', async () => {
		await inRolledBackTransaction(async (transaction) => {
			await setActiveTenant(transaction, firstPharmacy.tenantId);

			const revokedInvitations = await transaction`update pharmacy.tenant_member_invitations
				set revoked_at = now() where id = ${secondPharmacy.invitationId}`;

			expect(revokedInvitations.count).toBe(0);
		});
	});

	it('ne change pas les responsabilités d’un compte d’un autre Tenant', async () => {
		await inRolledBackTransaction(async (transaction) => {
			await setActiveTenant(transaction, firstPharmacy.tenantId);

			const updatedMemberships = await transaction`update pharmacy.tenant_memberships
				set member_kind = 'employee' where tenant_id = ${secondPharmacy.tenantId}`;

			expect(updatedMemberships.count).toBe(0);
		});
	});

	it('refuse un second compte comptoir dans la même pharmacie', async () => {
		await inRolledBackTransaction(async (transaction) => {
			await setActiveTenant(transaction, firstPharmacy.tenantId);
			await transaction`insert into pharmacy.tenant_memberships (tenant_id, account_id, member_kind)
				values (${firstPharmacy.tenantId}, ${secondPharmacy.accountId}, 'counter')`;

			await expect(
				transaction`update pharmacy.tenant_memberships set member_kind = 'counter'
					where tenant_id = ${firstPharmacy.tenantId} and account_id = ${firstPharmacy.accountId}`
			).rejects.toThrow(/tenant_memberships_one_counter_account_per_tenant/);
		});
	});

	it('refuse de relier le compte comptoir à un Employee', async () => {
		await inRolledBackTransaction(async (transaction) => {
			await setActiveTenant(transaction, firstPharmacy.tenantId);

			await expect(
				transaction`insert into pharmacy.tenant_memberships (tenant_id, account_id, member_kind, employee_id)
					values (${firstPharmacy.tenantId}, ${secondPharmacy.accountId}, 'counter', ${firstPharmacy.employeeId})`
			).rejects.toThrow(/tenant_memberships_counter_without_employee/);
		});
	});
});

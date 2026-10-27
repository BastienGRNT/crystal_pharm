import { existsSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Se lance avec `pnpm --filter @crystal-pharm/pharmacy-db test:integration`,
// Postgres démarré (`make start`) et migré (`make migrate`). Les fonctions
// écrivent pour de vrai : tout ce qui est créé ici est effacé à la fin.
const repositoryEnvironmentFile = new URL('../../../../../.env', import.meta.url);
if (existsSync(repositoryEnvironmentFile)) process.loadEnvFile(repositoryEnvironmentFile);

const { deleteCustomerAccountsWithEmailEnding, ensureCustomerAccount } = await import('@crystal-pharm/auth');
const pharmacyDatabase = await import('../index.server');

const testEmailDomain = '@member-access.integration.test';
const testPassword = 'integration-test-password';
const ownerEmail = `titulaire${testEmailDomain}`;
const employeeEmail = `preparatrice${testEmailDomain}`;
const strangerEmail = `inconnu${testEmailDomain}`;

let tenantId = '';
let ownerAccountId = '';
let employeeAccountId = '';
let strangerAccountId = '';
let employeeId = '';

beforeAll(async () => {
	await deleteCustomerAccountsWithEmailEnding(testEmailDomain);
	ownerAccountId = await ensureCustomerAccount({ email: ownerEmail, firstName: 'Léa', lastName: 'Garcia', password: testPassword });
	employeeAccountId = await ensureCustomerAccount({ email: employeeEmail, firstName: 'Camille', lastName: 'Fontaine', password: testPassword });
	strangerAccountId = await ensureCustomerAccount({ email: strangerEmail, firstName: 'Paul', lastName: 'Inconnu', password: testPassword });

	const tenantCreation = await pharmacyDatabase.createTenantForAccount(ownerAccountId, {
		name: 'Pharmacie des tests',
		street: '1 rue de la Paix',
		postalCode: '75002',
		city: 'Paris',
		phoneNumber: '01 23 45 67 89',
		email: ''
	});
	if (!tenantCreation.isSaved) throw new Error('The test pharmacy was refused.');
	tenantId = tenantCreation.tenantId;

	await pharmacyDatabase.addEmployee(tenantId, { firstName: 'Camille', lastName: 'Fontaine', jobTitle: 'Préparatrice' }, { kind: 'unchanged' });
	const [employee] = await pharmacyDatabase.listEmployees(tenantId);
	if (!employee) throw new Error('The test employee was refused.');
	employeeId = employee.employeeId;
});

afterAll(async () => {
	if (tenantId) await pharmacyDatabase.deleteTenant(tenantId);
	await deleteCustomerAccountsWithEmailEnding(testEmailDomain);
});

async function inviteTheEmployee(responsibilityKeyInputs: readonly string[]): Promise<string> {
	const invitation = await pharmacyDatabase.inviteEmployeeToCreateAccount(tenantId, {
		employeeId,
		emailInput: employeeEmail,
		responsibilityKeyInputs
	});
	if (!invitation.isSent) throw new Error(invitation.failureMessage);
	return invitation.invitationToken;
}

describe('les accès d’un TenantMember', () => {
	it('fait du compte qui crée la pharmacie son Owner, avec toutes les responsabilités', async () => {
		const ownerAccess = await pharmacyDatabase.findActiveTenantMemberAccess(ownerAccountId);

		expect(ownerAccess?.memberKind).toBe('owner');
		expect(ownerAccess?.responsibilityKeys).toContain('edit-site');
	});

	it('ne laisse pas retirer ni rétrograder le dernier Owner', async () => {
		const withdrawal = await pharmacyDatabase.withdrawTenantOwnership(tenantId, ownerAccountId);
		const removal = await pharmacyDatabase.removeTenantMember(tenantId, ownerAccountId);

		expect(withdrawal.isChanged).toBe(false);
		expect(removal.isChanged).toBe(false);
	});

	it('refuse l’invitation à un autre compte que celui de l’email invité', async () => {
		const invitationToken = await inviteTheEmployee(['handle-appointments']);

		const acceptance = await pharmacyDatabase.acceptTenantMemberInvitation(invitationToken, {
			accountId: strangerAccountId,
			email: strangerEmail
		});

		expect(acceptance.isAccepted).toBe(false);
		expect(await pharmacyDatabase.findActiveTenantMemberAccess(strangerAccountId)).toBeUndefined();
	});

	it('donne au compte invité les seules responsabilités choisies, une seule fois', async () => {
		const invitationToken = await inviteTheEmployee(['handle-appointments', 'not-a-responsibility']);

		const acceptance = await pharmacyDatabase.acceptTenantMemberInvitation(invitationToken, {
			accountId: employeeAccountId,
			email: employeeEmail
		});
		const secondAcceptance = await pharmacyDatabase.acceptTenantMemberInvitation(invitationToken, {
			accountId: employeeAccountId,
			email: employeeEmail
		});
		const employeeAccess = await pharmacyDatabase.findActiveTenantMemberAccess(employeeAccountId);

		expect(acceptance.isAccepted).toBe(true);
		expect(secondAcceptance.isAccepted).toBe(false);
		expect(employeeAccess).toMatchObject({ tenantId, memberKind: 'employee', employeeId, responsibilityKeys: ['handle-appointments'] });
	});

	it('n’accepte plus une invitation remplacée par une nouvelle', async () => {
		await pharmacyDatabase.removeTenantMember(tenantId, employeeAccountId);
		const replacedInvitationToken = await inviteTheEmployee([]);
		await inviteTheEmployee([]);

		const acceptance = await pharmacyDatabase.acceptTenantMemberInvitation(replacedInvitationToken, {
			accountId: employeeAccountId,
			email: employeeEmail
		});

		expect(acceptance.isAccepted).toBe(false);
	});

	it('laisse un second Owner retirer le titre au premier, jamais au dernier', async () => {
		const invitationToken = await inviteTheEmployee([]);
		await pharmacyDatabase.acceptTenantMemberInvitation(invitationToken, { accountId: employeeAccountId, email: employeeEmail });

		await pharmacyDatabase.appointTenantOwner(tenantId, employeeAccountId);
		const firstWithdrawal = await pharmacyDatabase.withdrawTenantOwnership(tenantId, ownerAccountId);
		const lastWithdrawal = await pharmacyDatabase.withdrawTenantOwnership(tenantId, employeeAccountId);

		expect(firstWithdrawal.isChanged).toBe(true);
		expect(lastWithdrawal.isChanged).toBe(false);
		expect((await pharmacyDatabase.findActiveTenantMemberAccess(ownerAccountId))?.responsibilityKeys).toEqual([]);
	});

	it('crée un seul compte comptoir, effacé avec son appartenance', async () => {
		const username = `comptoir.test${Date.now()}`;
		const creation = await pharmacyDatabase.createCounterAccountOfTenant(tenantId, {
			usernameInput: username,
			password: testPassword,
			responsibilityKeyInputs: ['handle-prescriptions']
		});
		const secondCreation = await pharmacyDatabase.createCounterAccountOfTenant(tenantId, {
			usernameInput: `${username}.bis`,
			password: testPassword,
			responsibilityKeyInputs: []
		});
		const counterMember = (await pharmacyDatabase.listTenantMembers(tenantId)).find((member) => member.memberKind === 'counter');

		expect(creation.isCreated).toBe(true);
		expect(secondCreation.isCreated).toBe(false);
		expect(counterMember).toMatchObject({ username, email: undefined, employeeId: undefined, responsibilityKeys: ['handle-prescriptions'] });

		await pharmacyDatabase.removeTenantMember(tenantId, counterMember?.accountId ?? '');
		const recreation = await pharmacyDatabase.createCounterAccountOfTenant(tenantId, {
			usernameInput: username,
			password: testPassword,
			responsibilityKeyInputs: []
		});
		expect(recreation.isCreated).toBe(true);
	});
});

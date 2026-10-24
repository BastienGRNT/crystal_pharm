import { existsSync } from 'node:fs';
import postgres from 'postgres';
import { afterAll, describe, expect, it } from 'vitest';

// Se lance avec `pnpm --filter @crystal-pharm/planning test:integration`,
// Postgres démarré (`make start`) et migré (`make migrate`).
const repositoryEnvironmentFile = new URL('../../../../../../../.env', import.meta.url);
if (existsSync(repositoryEnvironmentFile)) process.loadEnvFile(repositoryEnvironmentFile);

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is missing from the environment.');

const database = postgres(databaseUrl, { max: 1 });

// Le compte de développement est superutilisateur et contourne la
// Row-Level Security : chaque test l'endosse sous un rôle ordinaire, créé
// puis effacé dans la même transaction, qui est toujours annulée.
const probeRoleName = 'planning_isolation_probe';
const firstPharmacy = {
	tenantId: '00000000-0000-4000-a000-000000000001',
	employeeId: '11111111-1111-4111-a000-000000000001'
};
const secondPharmacy = {
	tenantId: '00000000-0000-4000-a000-000000000002',
	employeeId: '11111111-1111-4111-a000-000000000002'
};

class RollbackAfterTest extends Error {}

async function inRolledBackTransaction(test: (transaction: postgres.TransactionSql) => Promise<void>): Promise<void> {
	try {
		await database.begin(async (transaction) => {
			await insertTwoPharmaciesWithTheirPlanning(transaction);
			await actAsOrdinaryRole(transaction);
			await test(transaction);
			throw new RollbackAfterTest();
		});
	} catch (error) {
		if (!(error instanceof RollbackAfterTest)) throw error;
	}
}

async function insertTwoPharmaciesWithTheirPlanning(transaction: postgres.TransactionSql): Promise<void> {
	for (const { tenantId, employeeId } of [firstPharmacy, secondPharmacy]) {
		await transaction`insert into pharmacy.tenants (id, name, street, postal_code, city, phone_number)
			values (${tenantId}, ${tenantId}, '1 rue de la Paix', '75002', 'Paris', '0123456789')`;
		await transaction`insert into pharmacy.employees (id, tenant_id, first_name, last_name, job_title)
			values (${employeeId}, ${tenantId}, 'Hélène', 'Dubois', 'Pharmacienne titulaire')`;
		await transaction`insert into planning.shifts (id, tenant_id, employee_id, date, start_time, end_time)
			values (gen_random_uuid(), ${tenantId}, ${employeeId}, '2026-10-19', '08:30', '12:30')`;
		await transaction`insert into planning.absences (id, tenant_id, employee_id, first_date, last_date, kind)
			values (gen_random_uuid(), ${tenantId}, ${employeeId}, '2026-10-20', '2026-10-21', 'Congé')`;
	}
}

async function actAsOrdinaryRole(transaction: postgres.TransactionSql): Promise<void> {
	await transaction.unsafe(`create role ${probeRoleName} nologin`);
	for (const schemaName of ['pharmacy', 'planning']) {
		await transaction.unsafe(`grant usage on schema ${schemaName} to ${probeRoleName}`);
		await transaction.unsafe(`grant select, insert, update, delete on all tables in schema ${schemaName} to ${probeRoleName}`);
	}
	await transaction.unsafe(`set local role ${probeRoleName}`);
}

async function setActiveTenant(transaction: postgres.TransactionSql, tenantId: string): Promise<void> {
	await transaction`select set_config('app.tenant_id', ${tenantId}, true)`;
}

afterAll(async () => {
	await database.end();
});

describe('isolation du planning (Row-Level Security du schéma planning)', () => {
	it('ne montre à une pharmacie que ses créneaux et ses absences', async () => {
		await inRolledBackTransaction(async (transaction) => {
			await setActiveTenant(transaction, firstPharmacy.tenantId);

			const shifts = await transaction`select tenant_id from planning.shifts`;
			const absences = await transaction`select tenant_id from planning.absences`;

			expect(shifts.map(({ tenant_id }) => tenant_id)).toEqual([firstPharmacy.tenantId]);
			expect(absences.map(({ tenant_id }) => tenant_id)).toEqual([firstPharmacy.tenantId]);
		});
	});

	it('ne montre rien sans pharmacie active', async () => {
		await inRolledBackTransaction(async (transaction) => {
			const shifts = await transaction`select id from planning.shifts`;

			expect(shifts).toEqual([]);
		});
	});

	it('ne laisse ni modifier ni supprimer le planning d’une autre pharmacie', async () => {
		await inRolledBackTransaction(async (transaction) => {
			await setActiveTenant(transaction, firstPharmacy.tenantId);

			const updatedShifts = await transaction`update planning.shifts set end_time = '19:30'
				where tenant_id = ${secondPharmacy.tenantId}`;
			const deletedAbsences = await transaction`delete from planning.absences where tenant_id = ${secondPharmacy.tenantId}`;

			expect(updatedShifts.count).toBe(0);
			expect(deletedAbsences.count).toBe(0);
		});
	});

	it('ne laisse pas une pharmacie planifier au nom d’une autre', async () => {
		await inRolledBackTransaction(async (transaction) => {
			await setActiveTenant(transaction, firstPharmacy.tenantId);

			await expect(
				transaction`insert into planning.shifts (id, tenant_id, employee_id, date, start_time, end_time)
					values (gen_random_uuid(), ${secondPharmacy.tenantId}, ${secondPharmacy.employeeId}, '2026-10-22', '08:30', '12:30')`
			).rejects.toThrow(/row-level security/);
		});
	});
});

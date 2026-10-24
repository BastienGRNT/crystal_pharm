import { employees } from '@crystal-pharm/pharmacy-db/tables';
import { sql } from 'drizzle-orm';
import { check, date, index, pgPolicy, pgSchema, text, time, timestamp, uuid } from 'drizzle-orm/pg-core';
import type { AbsenceKind } from '../../domain/planning';

export const planningSchema = pgSchema('planning');

// Posé par transaction par `runAsTenant` (cf. `planningDatabase`). Après la
// transaction, le réglage vaut '' dans la connexion : `nullif` le ramène à NULL,
// qui ne donne accès à rien.
const activeTenantId = sql.raw(`nullif(current_setting('app.tenant_id', true), '')::uuid`);

const timestampWithTimeZone = (columnName: string) => timestamp(columnName, { withTimezone: true });

const ofActiveTenant = (policyName: string) =>
	pgPolicy(policyName, {
		for: 'all',
		using: sql`tenant_id = ${activeTenantId}`,
		withCheck: sql`tenant_id = ${activeTenantId}`
	});

/** Un créneau de travail d'un Employee, sur une journée. */
export const shifts = planningSchema.table(
	'shifts',
	{
		id: uuid('id').primaryKey(),
		tenantId: uuid('tenant_id').notNull(),
		employeeId: uuid('employee_id')
			.notNull()
			.references(() => employees.id, { onDelete: 'cascade' }),
		date: date('date', { mode: 'string' }).notNull(),
		startTime: time('start_time').notNull(),
		endTime: time('end_time').notNull(),
		createdAt: timestampWithTimeZone('created_at').notNull().defaultNow()
	},
	(table) => [
		index('shifts_tenant_id_date_index').on(table.tenantId, table.date),
		check('shifts_end_after_start', sql`${table.endTime} > ${table.startTime}`),
		ofActiveTenant('shifts_of_active_tenant')
	]
);

const absenceKinds = ['Congé', 'RTT', 'Arrêt maladie', 'Autre'] as const satisfies readonly AbsenceKind[];

/** Une absence d'un Employee, du premier au dernier jour compris. */
export const absences = planningSchema.table(
	'absences',
	{
		id: uuid('id').primaryKey(),
		tenantId: uuid('tenant_id').notNull(),
		employeeId: uuid('employee_id')
			.notNull()
			.references(() => employees.id, { onDelete: 'cascade' }),
		firstDate: date('first_date', { mode: 'string' }).notNull(),
		lastDate: date('last_date', { mode: 'string' }).notNull(),
		kind: text('kind').$type<AbsenceKind>().notNull(),
		createdAt: timestampWithTimeZone('created_at').notNull().defaultNow()
	},
	(table) => [
		index('absences_tenant_id_first_date_index').on(table.tenantId, table.firstDate),
		check('absences_last_date_not_before_first', sql`${table.lastDate} >= ${table.firstDate}`),
		check(
			'absences_kind_is_known',
			sql.raw(`kind in (${absenceKinds.map((absenceKind) => `'${absenceKind}'`).join(', ')})`)
		),
		ofActiveTenant('absences_of_active_tenant')
	]
);

import { employees } from '@crystal-pharm/pharmacy-db/tables';
import { sql } from 'drizzle-orm';
import {
	boolean,
	check,
	date,
	index,
	integer,
	pgPolicy,
	pgSchema,
	smallint,
	primaryKey,
	text,
	time,
	timestamp,
	uuid
} from 'drizzle-orm/pg-core';
import type { AbsenceKind } from '../../domain/planning';
import type { AvailabilityKind, AvailabilityStatus } from '../../domain/availability/availabilityRules';
import type { AvailabilityValidation } from '../../domain/rules/employeeTerms';
import { defaultPlanningRules } from '../../domain/rules/planningRules';

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

/** Les règles de la pharmacie : une ligne par Tenant, absente tant qu'il garde les règles par défaut. */
export const planningSettings = planningSchema.table(
	'planning_settings',
	{
		tenantId: uuid('tenant_id').primaryKey(),
		minimumPharmacistsPresent: integer('minimum_pharmacists_present')
			.notNull()
			.default(defaultPlanningRules.minimumPharmacistsPresent),
		minimumPeoplePresent: integer('minimum_people_present').notNull().default(defaultPlanningRules.minimumPeoplePresent),
		minimumShiftMinutes: integer('minimum_shift_minutes').notNull().default(defaultPlanningRules.minimumShiftMinutes),
		maximumShiftsPerDay: integer('maximum_shifts_per_day').notNull().default(defaultPlanningRules.maximumShiftsPerDay),
		minimumRestMinutes: integer('minimum_rest_minutes').notNull().default(defaultPlanningRules.minimumRestMinutes),
		updatedAt: timestampWithTimeZone('updated_at').notNull().defaultNow()
	},
	() => [ofActiveTenant('planning_settings_of_active_tenant')]
);

const availabilityValidations = ['automatic', 'manual'] as const satisfies readonly AvailabilityValidation[];

/** Le contrat et le statut d'un Employee, absents tant que le titulaire ne les a pas renseignés. */
export const employeeTerms = planningSchema.table(
	'employee_terms',
	{
		tenantId: uuid('tenant_id').notNull(),
		employeeId: uuid('employee_id')
			.notNull()
			.references(() => employees.id, { onDelete: 'cascade' }),
		weeklyContractMinutes: integer('weekly_contract_minutes'),
		hourlyRateCents: integer('hourly_rate_cents'),
		isStudent: boolean('is_student').notNull().default(false),
		availabilityValidation: text('availability_validation').$type<AvailabilityValidation>().notNull().default('manual'),
		updatedAt: timestampWithTimeZone('updated_at').notNull().defaultNow()
	},
	(table) => [
		primaryKey({ columns: [table.tenantId, table.employeeId] }),
		check('employee_terms_contract_minutes_positive', sql`${table.weeklyContractMinutes} is null or ${table.weeklyContractMinutes} > 0`),
		check('employee_terms_hourly_rate_not_negative', sql`${table.hourlyRateCents} is null or ${table.hourlyRateCents} >= 0`),
		check(
			'employee_terms_availability_validation_is_known',
			sql.raw(`availability_validation in (${availabilityValidations.map((validation) => `'${validation}'`).join(', ')})`)
		),
		ofActiveTenant('employee_terms_of_active_tenant')
	]
);

export type PlannedWeekStatus = 'draft' | 'published';

const plannedWeekStatuses = ['draft', 'published'] as const satisfies readonly PlannedWeekStatus[];

/**
 * L'état d'une semaine qui a été préparée : un brouillon n'est pas encore connu de l'équipe.
 * Une semaine sans ligne est modifiable librement et compte comme publiée.
 */
export const plannedWeeks = planningSchema.table(
	'planned_weeks',
	{
		tenantId: uuid('tenant_id').notNull(),
		mondayDate: date('monday_date', { mode: 'string' }).notNull(),
		status: text('status').$type<PlannedWeekStatus>().notNull(),
		publishedAt: timestampWithTimeZone('published_at'),
		updatedAt: timestampWithTimeZone('updated_at').notNull().defaultNow()
	},
	(table) => [
		primaryKey({ columns: [table.tenantId, table.mondayDate] }),
		check('planned_weeks_status_is_known', sql.raw(`status in (${plannedWeekStatuses.map((status) => `'${status}'`).join(', ')})`)),
		ofActiveTenant('planned_weeks_of_active_tenant')
	]
);

const availabilityKinds = ['unavailable', 'course', 'available'] as const satisfies readonly AvailabilityKind[];
const availabilityStatuses = ['pending', 'approved', 'declined'] as const satisfies readonly AvailabilityStatus[];
const quoted = (values: readonly string[]) => values.map((value) => `'${value}'`).join(', ');

/** Une indisponibilité, un cours ou une disponibilité d'un Employee : chaque semaine (`weekday`) ou un jour précis (`date`). */
export const availabilityRules = planningSchema.table(
	'availability_rules',
	{
		id: uuid('id').primaryKey(),
		tenantId: uuid('tenant_id').notNull(),
		employeeId: uuid('employee_id')
			.notNull()
			.references(() => employees.id, { onDelete: 'cascade' }),
		kind: text('kind').$type<AvailabilityKind>().notNull(),
		weekday: smallint('weekday'),
		date: date('date', { mode: 'string' }),
		startTime: time('start_time').notNull(),
		endTime: time('end_time').notNull(),
		status: text('status').$type<AvailabilityStatus>().notNull(),
		note: text('note').notNull().default(''),
		decidedAt: timestampWithTimeZone('decided_at'),
		createdAt: timestampWithTimeZone('created_at').notNull().defaultNow()
	},
	(table) => [
		index('availability_rules_tenant_id_employee_id_index').on(table.tenantId, table.employeeId),
		index('availability_rules_tenant_id_status_index').on(table.tenantId, table.status),
		check('availability_rules_kind_is_known', sql.raw(`kind in (${quoted(availabilityKinds)})`)),
		check('availability_rules_status_is_known', sql.raw(`status in (${quoted(availabilityStatuses)})`)),
		check('availability_rules_weekday_or_date', sql`(${table.weekday} is null) <> (${table.date} is null)`),
		check('availability_rules_weekday_is_valid', sql`${table.weekday} is null or ${table.weekday} between 0 and 6`),
		check('availability_rules_ends_after_start', sql`${table.startTime} < ${table.endTime}`),
		ofActiveTenant('availability_rules_of_active_tenant')
	]
);

export type PlanningNoticeKind = 'availability-requested' | 'availability-decided';

const planningNoticeKinds = ['availability-requested', 'availability-decided'] as const satisfies readonly PlanningNoticeKind[];

/** Une notification dans l'application, pour un compte du Tenant (sans clé étrangère : le compte vit dans un autre schéma). */
export const planningNotices = planningSchema.table(
	'planning_notices',
	{
		id: uuid('id').primaryKey(),
		tenantId: uuid('tenant_id').notNull(),
		recipientAccountId: uuid('recipient_account_id').notNull(),
		kind: text('kind').$type<PlanningNoticeKind>().notNull(),
		message: text('message').notNull(),
		linkPathname: text('link_pathname').notNull(),
		readAt: timestampWithTimeZone('read_at'),
		createdAt: timestampWithTimeZone('created_at').notNull().defaultNow()
	},
	(table) => [
		index('planning_notices_tenant_id_recipient_created_index').on(table.tenantId, table.recipientAccountId, table.createdAt),
		check('planning_notices_kind_is_known', sql.raw(`kind in (${quoted(planningNoticeKinds)})`)),
		ofActiveTenant('planning_notices_of_active_tenant')
	]
);

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
import type { PlannedActivityKind } from '../../domain/activities/plannedActivities';
import type { AbsenceStatus } from '../../domain/leave/leaveRequests';
import type { AvailabilityKind, AvailabilityStatus } from '../../domain/availability/availabilityRules';
import type { AvailabilityValidation } from '../../domain/rules/employeeTerms';
import { defaultPlanningRules } from '../../domain/rules/planningRules';
import { collectiveAgreementOvertimeRules } from '../../domain/overtime/overtimePay';

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
const absenceStatuses = ['pending', 'approved', 'declined'] as const satisfies readonly AbsenceStatus[];

/** Une absence d'un Employee, du premier au dernier jour compris ; seule une absence acceptée compte dans le planning. */
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
		status: text('status').$type<AbsenceStatus>().notNull().default('approved'),
		note: text('note').notNull().default(''),
		decidedAt: timestampWithTimeZone('decided_at'),
		createdAt: timestampWithTimeZone('created_at').notNull().defaultNow()
	},
	(table) => [
		index('absences_tenant_id_first_date_index').on(table.tenantId, table.firstDate),
		index('absences_tenant_id_status_index').on(table.tenantId, table.status),
		check('absences_status_is_known', sql.raw(`status in (${absenceStatuses.map((status) => `'${status}'`).join(', ')})`)),
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
		overtimeWeeklyThresholdMinutes: integer('overtime_weekly_threshold_minutes')
			.notNull()
			.default(collectiveAgreementOvertimeRules.weeklyThresholdMinutes),
		overtimeFirstBandMinutes: integer('overtime_first_band_minutes').notNull().default(collectiveAgreementOvertimeRules.firstBandMinutes),
		overtimeFirstBandRatePercent: integer('overtime_first_band_rate_percent')
			.notNull()
			.default(collectiveAgreementOvertimeRules.firstBandRatePercent),
		overtimeBeyondRatePercent: integer('overtime_beyond_rate_percent')
			.notNull()
			.default(collectiveAgreementOvertimeRules.beyondRatePercent),
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
		isPlannedManually: boolean('is_planned_manually').notNull().default(false),
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

export type PlanningNoticeKind = 'availability-requested' | 'availability-decided' | 'leave-requested' | 'leave-decided';

const planningNoticeKinds = [
	'availability-requested',
	'availability-decided',
	'leave-requested',
	'leave-decided'
] as const satisfies readonly PlanningNoticeKind[];

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

const plannedActivityKinds = ['training', 'on-call'] as const satisfies readonly PlannedActivityKind[];

/** Une formation ou une astreinte d'un Employee, posée par le titulaire sur une journée. */
export const plannedActivities = planningSchema.table(
	'planned_activities',
	{
		id: uuid('id').primaryKey(),
		tenantId: uuid('tenant_id').notNull(),
		employeeId: uuid('employee_id')
			.notNull()
			.references(() => employees.id, { onDelete: 'cascade' }),
		kind: text('kind').$type<PlannedActivityKind>().notNull(),
		date: date('date', { mode: 'string' }).notNull(),
		startTime: time('start_time').notNull(),
		endTime: time('end_time').notNull(),
		label: text('label').notNull().default(''),
		createdAt: timestampWithTimeZone('created_at').notNull().defaultNow()
	},
	(table) => [
		index('planned_activities_tenant_id_date_index').on(table.tenantId, table.date),
		check('planned_activities_kind_is_known', sql.raw(`kind in (${quoted(plannedActivityKinds)})`)),
		check('planned_activities_ends_after_start', sql`${table.startTime} < ${table.endTime}`),
		ofActiveTenant('planned_activities_of_active_tenant')
	]
);

/** Une heure de pointe qui revient chaque semaine : l'effectif demandé y monte. */
export const peakWindows = planningSchema.table(
	'peak_windows',
	{
		id: uuid('id').primaryKey(),
		tenantId: uuid('tenant_id').notNull(),
		weekday: smallint('weekday').notNull(),
		startTime: time('start_time').notNull(),
		endTime: time('end_time').notNull(),
		requiredCount: integer('required_count').notNull(),
		createdAt: timestampWithTimeZone('created_at').notNull().defaultNow()
	},
	(table) => [
		index('peak_windows_tenant_id_weekday_index').on(table.tenantId, table.weekday),
		check('peak_windows_weekday_is_valid', sql`${table.weekday} between 0 and 6`),
		check('peak_windows_ends_after_start', sql`${table.startTime} < ${table.endTime}`),
		check('peak_windows_required_count_positive', sql`${table.requiredCount} > 0`),
		ofActiveTenant('peak_windows_of_active_tenant')
	]
);

/** Une semaine type nommée ; `rotation` la réserve aux semaines A ou B. */
export const weekTemplates = planningSchema.table(
	'week_templates',
	{
		id: uuid('id').primaryKey(),
		tenantId: uuid('tenant_id').notNull(),
		name: text('name').notNull(),
		rotation: text('rotation').$type<'A' | 'B'>(),
		createdAt: timestampWithTimeZone('created_at').notNull().defaultNow()
	},
	(table) => [
		index('week_templates_tenant_id_index').on(table.tenantId),
		check('week_templates_rotation_is_known', sql`${table.rotation} is null or ${table.rotation} in ('A', 'B')`),
		ofActiveTenant('week_templates_of_active_tenant')
	]
);

/** Un créneau d'une semaine type, rattaché à un jour de la semaine plutôt qu'à une date. */
export const weekTemplateShifts = planningSchema.table(
	'week_template_shifts',
	{
		id: uuid('id').primaryKey(),
		tenantId: uuid('tenant_id').notNull(),
		templateId: uuid('template_id')
			.notNull()
			.references(() => weekTemplates.id, { onDelete: 'cascade' }),
		employeeId: uuid('employee_id')
			.notNull()
			.references(() => employees.id, { onDelete: 'cascade' }),
		weekday: smallint('weekday').notNull(),
		startTime: time('start_time').notNull(),
		endTime: time('end_time').notNull()
	},
	(table) => [
		index('week_template_shifts_tenant_id_template_id_index').on(table.tenantId, table.templateId),
		check('week_template_shifts_weekday_is_valid', sql`${table.weekday} between 0 and 6`),
		check('week_template_shifts_ends_after_start', sql`${table.startTime} < ${table.endTime}`),
		ofActiveTenant('week_template_shifts_of_active_tenant')
	]
);

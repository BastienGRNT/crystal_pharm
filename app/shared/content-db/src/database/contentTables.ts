import type { ModuleName, ServicesModuleData } from '@crystal-pharm/schema';
import { sql } from 'drizzle-orm';
import { check, index, jsonb, pgPolicy, pgSchema, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const contentSchema = pgSchema('content');

// Posés par transaction (`set_config(…, true)`) par `runAsTenant`. Un réglage
// absent vaut NULL : il ne donne accès à rien.
const activeTenantId = sql.raw(`nullif(current_setting('app.tenant_id', true), '')::uuid`);
const isPlatform = sql.raw(`current_setting('app.is_platform', true) = 'on'`);

/** D'où viennent les actualités affichées : celles du Tenant ou celles de son groupement. */
export const newsSources = ['pharmacy', 'group'] as const;
export type NewsSource = (typeof newsSources)[number];

const timestampWithTimeZone = (columnName: string) => timestamp(columnName, { withTimezone: true });

/**
 * Le site d'un Tenant : son layout et ce qu'il y a saisi. La fiche (nom,
 * adresse, téléphone, horaires, équipe) n'est pas ici : elle vient de
 * `pharmacy-db`. Pas de clé étrangère vers `pharmacy.tenants` : `content-db`
 * ne dépend que d'`engine/schema`.
 */
export const tenantSites = contentSchema.table(
	'tenant_sites',
	{
		tenantId: uuid('tenant_id').primaryKey(),
		layoutId: text('layout_id').notNull(),
		/**
		 * Les réglages de chaque layout essayé, par identifiant : revenir à un
		 * layout retrouve ses réglages. Validés par le schéma du layout.
		 */
		layoutSettingsByLayoutId: jsonb('layout_settings')
			.$type<Record<string, Record<string, unknown>>>()
			.notNull()
			.default({}),
		enabledModules: jsonb('enabled_modules').$type<ModuleName[]>().notNull().default([]),
		services: jsonb('services').$type<ServicesModuleData['services']>().notNull().default([]),
		prescriptionIntroduction: text('prescription_introduction'),
		/** Le choix du Tenant ; son groupement peut l'imposer (cf. `group-db`). */
		newsSource: text('news_source').$type<NewsSource>().notNull().default('pharmacy'),
		createdAt: timestampWithTimeZone('created_at').notNull().defaultNow(),
		updatedAt: timestampWithTimeZone('updated_at')
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date())
	},
	(table) => [
		check('tenant_sites_news_source_check', sql`${table.newsSource} in ('pharmacy', 'group')`),
		pgPolicy('tenant_sites_of_active_tenant', {
			for: 'all',
			using: sql`tenant_id = ${activeTenantId} or ${isPlatform}`,
			withCheck: sql`tenant_id = ${activeTenantId} or ${isPlatform}`
		})
	]
);

/** Une actualité publiée par un Tenant sur son site. */
export const articles = contentSchema.table(
	'articles',
	{
		id: uuid('id').primaryKey(),
		tenantId: uuid('tenant_id').notNull(),
		title: text('title').notNull(),
		summary: text('summary').notNull(),
		publishedAt: timestampWithTimeZone('published_at').notNull(),
		createdAt: timestampWithTimeZone('created_at').notNull().defaultNow()
	},
	(table) => [
		index('articles_tenant_id_published_at_index').on(table.tenantId, table.publishedAt),
		pgPolicy('articles_of_active_tenant', {
			for: 'all',
			using: sql`tenant_id = ${activeTenantId} or ${isPlatform}`,
			withCheck: sql`tenant_id = ${activeTenantId} or ${isPlatform}`
		})
	]
);

import type { ModuleName } from '@crystal-pharm/schema';
import { sql } from 'drizzle-orm';
import { boolean, check, customType, index, jsonb, pgPolicy, pgSchema, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import type { SiteImage } from '../tenant-sites/siteImage';
import type {
	StoredAppointment,
	StoredBrand,
	StoredFindUs,
	StoredHero,
	StoredOnDutyPeriod,
	StoredOnlineOrder,
	StoredService
} from '../tenant-sites/storedSiteContent';

export const contentSchema = pgSchema('content');

// Posés par transaction (`set_config(…, true)`) par `runAsTenant`. Un réglage
// absent vaut NULL : il ne donne accès à rien.
const activeTenantId = sql.raw(`nullif(current_setting('app.tenant_id', true), '')::uuid`);
const isPlatform = sql.raw(`current_setting('app.is_platform', true) = 'on'`);
// Posé par la passerelle, qui ne connaît que l'adresse demandée : elle ne voit que cette ligne.
const requestedSubdomain = sql.raw(`nullif(current_setting('app.requested_subdomain', true), '')`);

/** D'où viennent les actualités affichées : celles du Tenant ou celles de son groupement. */
export const newsSources = ['pharmacy', 'group'] as const;
export type NewsSource = (typeof newsSources)[number];

const binaryData = customType<{ data: Buffer }>({ dataType: () => 'bytea' });

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
		services: jsonb('services').$type<StoredService[]>().notNull().default([]),
		/** L'ordre voulu des modules ; un module activé qui n'y figure pas vient après, dans l'ordre par défaut. */
		moduleOrder: jsonb('module_order').$type<ModuleName[]>().notNull().default([]),
		hero: jsonb('hero').$type<StoredHero>(),
		findUs: jsonb('find_us').$type<StoredFindUs>(),
		brands: jsonb('brands').$type<StoredBrand[]>().notNull().default([]),
		appointment: jsonb('appointment').$type<StoredAppointment>(),
		onlineOrder: jsonb('online_order').$type<StoredOnlineOrder>(),
		/** Les gardes déclarées par la pharmacie ; le bandeau du site s'affiche pendant l'une d'elles. */
		onDutyPeriods: jsonb('on_duty_periods').$type<StoredOnDutyPeriod[]>().notNull().default([]),
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
		image: jsonb('image').$type<SiteImage>(),
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

/**
 * Les adresses d'un site sous notre domaine (`<subdomain>.<domaine des sites>`).
 * Une seule est l'actuelle ; les anciennes restent à leur Tenant, qui les
 * redirige vers l'actuelle : un lien déjà partagé marche toujours, et personne
 * d'autre ne peut la reprendre. Unique entre tous les Tenants.
 */
export const siteSubdomains = contentSchema.table(
	'site_subdomains',
	{
		subdomain: text('subdomain').primaryKey(),
		tenantId: uuid('tenant_id').notNull(),
		isCurrent: boolean('is_current').notNull(),
		createdAt: timestampWithTimeZone('created_at').notNull().defaultNow()
	},
	(table) => [
		index('site_subdomains_tenant_id_index').on(table.tenantId, table.isCurrent),
		uniqueIndex('site_subdomains_one_current_per_tenant').on(table.tenantId).where(sql`${table.isCurrent}`),
		pgPolicy('site_subdomains_of_active_tenant', {
			for: 'all',
			using: sql`tenant_id = ${activeTenantId} or ${isPlatform}`,
			withCheck: sql`tenant_id = ${activeTenantId} or ${isPlatform}`
		}),
		pgPolicy('site_subdomains_requested_by_gateway', {
			for: 'select',
			using: sql`subdomain = ${requestedSubdomain}`
		})
	]
);

/**
 * Une image envoyée par un Tenant pour son site (logo de marque, illustration…).
 * Petite (2 Mo au plus) : elle reste en base, derrière la même isolation que le
 * reste du contenu. Jamais modifiée : un remplacement est une nouvelle ligne.
 */
export const siteImages = contentSchema.table(
	'site_images',
	{
		id: uuid('id').primaryKey(),
		tenantId: uuid('tenant_id').notNull(),
		contentType: text('content_type').notNull(),
		data: binaryData('data').notNull(),
		createdAt: timestampWithTimeZone('created_at').notNull().defaultNow()
	},
	(table) => [
		index('site_images_tenant_id_index').on(table.tenantId),
		pgPolicy('site_images_of_active_tenant', {
			for: 'all',
			using: sql`tenant_id = ${activeTenantId} or ${isPlatform}`,
			withCheck: sql`tenant_id = ${activeTenantId} or ${isPlatform}`
		})
	]
);

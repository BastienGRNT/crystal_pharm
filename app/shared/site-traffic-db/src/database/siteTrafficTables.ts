import { sql } from 'drizzle-orm';
import { integer, pgPolicy, pgSchema, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const siteTrafficSchema = pgSchema('site_traffic');

// Posés par transaction (`set_config(…, true)`) par `runAsTenant`. Un réglage
// absent vaut NULL : il ne donne accès à rien.
const activeTenantId = sql.raw(`nullif(current_setting('app.tenant_id', true), '')::uuid`);
const isPlatform = sql.raw(`current_setting('app.is_platform', true) = 'on'`);

/**
 * Les pages vues d'un site public, comptées par heure et par page. Rien qui
 * désigne un Visitor (ni cookie, ni adresse IP, ni navigateur) : un compteur
 * agrégé, sans consentement à demander. Pas de clé étrangère vers
 * `pharmacy.tenants` : ce package ne dépend d'aucun autre.
 */
export const hourlyPageViews = siteTrafficSchema.table(
	'hourly_page_views',
	{
		tenantId: uuid('tenant_id').notNull(),
		/** Le début de l'heure, arrondi. */
		hourStart: timestamp('hour_start', { withTimezone: true }).notNull(),
		pagePath: text('page_path').notNull(),
		viewCount: integer('view_count').notNull(),
		/** Les vues arrivées d'ailleurs que du site lui-même : le début d'une visite. */
		visitCount: integer('visit_count').notNull()
	},
	(table) => [
		primaryKey({ columns: [table.tenantId, table.hourStart, table.pagePath] }),
		pgPolicy('hourly_page_views_of_active_tenant', {
			for: 'all',
			using: sql`tenant_id = ${activeTenantId} or ${isPlatform}`,
			withCheck: sql`tenant_id = ${activeTenantId} or ${isPlatform}`
		})
	]
);

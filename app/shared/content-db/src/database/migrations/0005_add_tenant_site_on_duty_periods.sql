ALTER TABLE "content"."tenant_sites" ADD COLUMN "on_duty_periods" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint

-- Le contenu du site, avec les gardes déclarées par le Tenant.
CREATE OR REPLACE FUNCTION content.read_tenant_site_content(requested_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
BEGIN
	PERFORM set_config('app.tenant_id', requested_tenant_id::text, true);
	RETURN (
		SELECT jsonb_build_object(
			'layoutId', site.layout_id,
			'layoutSettingsByLayoutId', site.layout_settings,
			'enabledModules', site.enabled_modules,
			'moduleOrder', site.module_order,
			'services', site.services,
			'hero', site.hero,
			'findUs', site.find_us,
			'brands', site.brands,
			'appointment', site.appointment,
			'onlineOrder', site.online_order,
			'onDutyPeriods', site.on_duty_periods,
			'prescriptionIntroduction', site.prescription_introduction,
			'newsSource', site.news_source,
			'articles', coalesce((
				SELECT jsonb_agg(
					jsonb_strip_nulls(jsonb_build_object(
						'title', article.title,
						'summary', article.summary,
						'publishedAt', to_char(article.published_at AT TIME ZONE 'Europe/Paris', 'YYYY-MM-DD'),
						'image', article.image
					)) ORDER BY article.published_at DESC
				)
				FROM content.articles AS article
				WHERE article.tenant_id = requested_tenant_id
			), '[]'::jsonb)
		)
		FROM content.tenant_sites AS site
		WHERE site.tenant_id = requested_tenant_id
	);
END;
$$;

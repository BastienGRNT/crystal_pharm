CREATE TABLE "content"."site_images" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"content_type" text NOT NULL,
	"data" "bytea" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content"."site_images" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "content"."articles" ADD COLUMN "image" jsonb;--> statement-breakpoint
ALTER TABLE "content"."tenant_sites" ADD COLUMN "module_order" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "content"."tenant_sites" ADD COLUMN "hero" jsonb;--> statement-breakpoint
ALTER TABLE "content"."tenant_sites" ADD COLUMN "find_us" jsonb;--> statement-breakpoint
ALTER TABLE "content"."tenant_sites" ADD COLUMN "brands" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "content"."tenant_sites" ADD COLUMN "appointment" jsonb;--> statement-breakpoint
ALTER TABLE "content"."tenant_sites" ADD COLUMN "online_order" jsonb;--> statement-breakpoint
CREATE INDEX "site_images_tenant_id_index" ON "content"."site_images" USING btree ("tenant_id");--> statement-breakpoint
CREATE POLICY "site_images_of_active_tenant" ON "content"."site_images" AS PERMISSIVE FOR ALL TO public USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid or current_setting('app.is_platform', true) = 'on') WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid or current_setting('app.is_platform', true) = 'on');--> statement-breakpoint

-- Le contenu du site : les sections fixes, les nouveaux modules, l'ordre et les images choisies.
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

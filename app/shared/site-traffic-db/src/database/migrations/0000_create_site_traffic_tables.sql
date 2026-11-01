CREATE SCHEMA IF NOT EXISTS "site_traffic";
--> statement-breakpoint
CREATE TABLE "site_traffic"."hourly_page_views" (
	"tenant_id" uuid NOT NULL,
	"hour_start" timestamp with time zone NOT NULL,
	"page_path" text NOT NULL,
	"view_count" integer NOT NULL,
	"visit_count" integer NOT NULL,
	CONSTRAINT "hourly_page_views_tenant_id_hour_start_page_path_pk" PRIMARY KEY("tenant_id","hour_start","page_path")
);
--> statement-breakpoint
ALTER TABLE "site_traffic"."hourly_page_views" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "hourly_page_views_of_active_tenant" ON "site_traffic"."hourly_page_views" AS PERMISSIVE FOR ALL TO public USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid or current_setting('app.is_platform', true) = 'on') WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid or current_setting('app.is_platform', true) = 'on');
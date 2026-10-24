CREATE SCHEMA IF NOT EXISTS "content";
--> statement-breakpoint
CREATE TABLE "content"."articles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content"."articles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "content"."tenant_sites" (
	"tenant_id" uuid PRIMARY KEY NOT NULL,
	"layout_id" text NOT NULL,
	"layout_settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"enabled_modules" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"services" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"prescription_introduction" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content"."tenant_sites" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "articles_tenant_id_published_at_index" ON "content"."articles" USING btree ("tenant_id","published_at");--> statement-breakpoint
CREATE POLICY "articles_of_active_tenant" ON "content"."articles" AS PERMISSIVE FOR ALL TO public USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid or current_setting('app.is_platform', true) = 'on') WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid or current_setting('app.is_platform', true) = 'on');--> statement-breakpoint
CREATE POLICY "tenant_sites_of_active_tenant" ON "content"."tenant_sites" AS PERMISSIVE FOR ALL TO public USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid or current_setting('app.is_platform', true) = 'on') WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid or current_setting('app.is_platform', true) = 'on');
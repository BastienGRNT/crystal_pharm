CREATE TABLE "content"."site_subdomains" (
	"subdomain" text PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"is_current" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content"."site_subdomains" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "site_subdomains_tenant_id_index" ON "content"."site_subdomains" USING btree ("tenant_id","is_current");--> statement-breakpoint
CREATE UNIQUE INDEX "site_subdomains_one_current_per_tenant" ON "content"."site_subdomains" USING btree ("tenant_id") WHERE "content"."site_subdomains"."is_current";--> statement-breakpoint
CREATE POLICY "site_subdomains_of_active_tenant" ON "content"."site_subdomains" AS PERMISSIVE FOR ALL TO public USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid or current_setting('app.is_platform', true) = 'on') WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid or current_setting('app.is_platform', true) = 'on');--> statement-breakpoint
CREATE POLICY "site_subdomains_requested_by_gateway" ON "content"."site_subdomains" AS PERMISSIVE FOR SELECT TO public USING (subdomain = nullif(current_setting('app.requested_subdomain', true), ''));
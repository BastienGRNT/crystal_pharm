CREATE TABLE "billing"."terms_acceptances" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"terms_version" text NOT NULL,
	"accepted_by_user_id" text NOT NULL,
	"accepted_by_name" text NOT NULL,
	"accepted_by_email" text NOT NULL,
	"accepted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "billing"."terms_acceptances" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "billing"."terms_acceptances" ADD CONSTRAINT "terms_acceptances_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "pharmacy"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "terms_acceptances_tenant_id_index" ON "billing"."terms_acceptances" USING btree ("tenant_id","terms_version");--> statement-breakpoint
CREATE POLICY "terms_acceptances_readable_by_active_tenant" ON "billing"."terms_acceptances" AS PERMISSIVE FOR SELECT TO public USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid or current_setting('app.is_platform', true) = 'on');--> statement-breakpoint
CREATE POLICY "terms_acceptances_recorded_by_active_tenant" ON "billing"."terms_acceptances" AS PERMISSIVE FOR INSERT TO public WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
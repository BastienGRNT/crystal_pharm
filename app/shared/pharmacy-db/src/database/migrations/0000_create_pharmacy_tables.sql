CREATE SCHEMA IF NOT EXISTS "pharmacy";
--> statement-breakpoint
CREATE TABLE "pharmacy"."tenant_memberships" (
	"tenant_id" uuid NOT NULL,
	"account_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_memberships_tenant_id_account_id_pk" PRIMARY KEY("tenant_id","account_id")
);
--> statement-breakpoint
ALTER TABLE "pharmacy"."tenant_memberships" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "pharmacy"."tenants" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"street" text NOT NULL,
	"postal_code" text NOT NULL,
	"city" text NOT NULL,
	"phone_number" text NOT NULL,
	"email" text,
	"weekly_opening_schedule" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pharmacy"."tenants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "pharmacy"."tenant_memberships" ADD CONSTRAINT "tenant_memberships_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "pharmacy"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pharmacy"."tenant_memberships" ADD CONSTRAINT "tenant_memberships_account_id_users_id_fk" FOREIGN KEY ("account_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tenant_memberships_account_id_index" ON "pharmacy"."tenant_memberships" USING btree ("account_id");--> statement-breakpoint
CREATE POLICY "tenant_memberships_of_active_tenant_or_account" ON "pharmacy"."tenant_memberships" AS PERMISSIVE FOR ALL TO public USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid or account_id = nullif(current_setting('app.account_id', true), '')) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tenants_of_active_tenant_or_account" ON "pharmacy"."tenants" AS PERMISSIVE FOR ALL TO public USING (id = nullif(current_setting('app.tenant_id', true), '')::uuid or id in (select tenant_id from pharmacy.tenant_memberships where account_id = nullif(current_setting('app.account_id', true), ''))) WITH CHECK (id = nullif(current_setting('app.tenant_id', true), '')::uuid);
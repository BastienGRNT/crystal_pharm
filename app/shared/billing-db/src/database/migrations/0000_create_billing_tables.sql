CREATE SCHEMA IF NOT EXISTS "billing";
--> statement-breakpoint
CREATE TABLE "billing"."catalog_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"pack_monthly_price_cents" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "catalog_settings_is_a_single_row" CHECK (id = 1)
);
--> statement-breakpoint
ALTER TABLE "billing"."catalog_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "billing"."checkouts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid,
	"group_id" uuid,
	"purpose" text NOT NULL,
	"tool_keys" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"lines" jsonb NOT NULL,
	"amount_cents" integer NOT NULL,
	"description" text NOT NULL,
	"return_pathname" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "billing"."checkouts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "billing"."group_contracts" (
	"group_id" uuid PRIMARY KEY NOT NULL,
	"payment_method" text NOT NULL,
	"status" text NOT NULL,
	"activated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "billing"."group_contracts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "billing"."group_tool_coverages" (
	"group_id" uuid NOT NULL,
	"tool_key" text NOT NULL,
	"discount_percent" integer NOT NULL,
	"group_share_percent" integer NOT NULL,
	CONSTRAINT "group_tool_coverages_group_id_tool_key_pk" PRIMARY KEY("group_id","tool_key"),
	CONSTRAINT "group_tool_coverages_discount_is_a_percentage" CHECK (discount_percent between 0 and 100),
	CONSTRAINT "group_tool_coverages_share_is_a_percentage" CHECK (group_share_percent between 0 and 100)
);
--> statement-breakpoint
ALTER TABLE "billing"."group_tool_coverages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "billing"."payments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid,
	"group_id" uuid,
	"checkout_id" uuid,
	"amount_cents" integer NOT NULL,
	"description" text NOT NULL,
	"status" text NOT NULL,
	"provider_payment_reference" text NOT NULL,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL,
	"refunded_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "billing"."payments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "billing"."tenant_subscription_tools" (
	"tenant_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	"tool_key" text NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ends_at" timestamp with time zone,
	CONSTRAINT "tenant_subscription_tools_subscription_id_tool_key_pk" PRIMARY KEY("subscription_id","tool_key")
);
--> statement-breakpoint
ALTER TABLE "billing"."tenant_subscription_tools" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "billing"."tenant_subscriptions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"cancelled_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"provider_subscription_reference" text
);
--> statement-breakpoint
ALTER TABLE "billing"."tenant_subscriptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "billing"."tool_prices" (
	"tool_key" text PRIMARY KEY NOT NULL,
	"monthly_price_cents" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tool_prices_are_positive" CHECK (monthly_price_cents >= 0)
);
--> statement-breakpoint
ALTER TABLE "billing"."tool_prices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "billing"."checkouts" ADD CONSTRAINT "checkouts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "pharmacy"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing"."checkouts" ADD CONSTRAINT "checkouts_group_id_pharmacy_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "groups"."pharmacy_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing"."group_contracts" ADD CONSTRAINT "group_contracts_group_id_pharmacy_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "groups"."pharmacy_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing"."group_tool_coverages" ADD CONSTRAINT "group_tool_coverages_group_id_group_contracts_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "billing"."group_contracts"("group_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing"."payments" ADD CONSTRAINT "payments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "pharmacy"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing"."payments" ADD CONSTRAINT "payments_group_id_pharmacy_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "groups"."pharmacy_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing"."payments" ADD CONSTRAINT "payments_checkout_id_checkouts_id_fk" FOREIGN KEY ("checkout_id") REFERENCES "billing"."checkouts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing"."tenant_subscription_tools" ADD CONSTRAINT "tenant_subscription_tools_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "pharmacy"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing"."tenant_subscription_tools" ADD CONSTRAINT "tenant_subscription_tools_subscription_id_tenant_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "billing"."tenant_subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing"."tenant_subscriptions" ADD CONSTRAINT "tenant_subscriptions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "pharmacy"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "checkouts_tenant_id_index" ON "billing"."checkouts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "checkouts_group_id_index" ON "billing"."checkouts" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "payments_tenant_id_index" ON "billing"."payments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "payments_group_id_index" ON "billing"."payments" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "tenant_subscription_tools_tenant_id_index" ON "billing"."tenant_subscription_tools" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "tenant_subscriptions_tenant_id_index" ON "billing"."tenant_subscriptions" USING btree ("tenant_id");--> statement-breakpoint
CREATE POLICY "catalog_settings_readable_by_everyone" ON "billing"."catalog_settings" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "catalog_settings_written_by_platform" ON "billing"."catalog_settings" AS PERMISSIVE FOR ALL TO public USING (current_setting('app.is_platform', true) = 'on') WITH CHECK (current_setting('app.is_platform', true) = 'on');--> statement-breakpoint
CREATE POLICY "checkouts_of_their_payer" ON "billing"."checkouts" AS PERMISSIVE FOR ALL TO public USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid or group_id = nullif(current_setting('app.group_id', true), '')::uuid or current_setting('app.is_platform', true) = 'on') WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid or group_id = nullif(current_setting('app.group_id', true), '')::uuid or current_setting('app.is_platform', true) = 'on');--> statement-breakpoint
CREATE POLICY "group_contracts_readable_by_their_group_and_pharmacies" ON "billing"."group_contracts" AS PERMISSIVE FOR SELECT TO public USING (group_id = nullif(current_setting('app.group_id', true), '')::uuid or current_setting('app.is_platform', true) = 'on' or group_id in (
	select group_id from groups.pharmacy_memberships where tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid
	union select group_id from groups.pharmacy_invitations where email = nullif(current_setting('app.account_email', true), '') or token_hash = nullif(current_setting('app.invitation_token_hash', true), '')));--> statement-breakpoint
CREATE POLICY "group_contracts_written_by_platform" ON "billing"."group_contracts" AS PERMISSIVE FOR ALL TO public USING (current_setting('app.is_platform', true) = 'on') WITH CHECK (current_setting('app.is_platform', true) = 'on');--> statement-breakpoint
CREATE POLICY "group_tool_coverages_readable_by_their_group_and_pharmacies" ON "billing"."group_tool_coverages" AS PERMISSIVE FOR SELECT TO public USING (group_id = nullif(current_setting('app.group_id', true), '')::uuid or current_setting('app.is_platform', true) = 'on' or group_id in (
	select group_id from groups.pharmacy_memberships where tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid
	union select group_id from groups.pharmacy_invitations where email = nullif(current_setting('app.account_email', true), '') or token_hash = nullif(current_setting('app.invitation_token_hash', true), '')));--> statement-breakpoint
CREATE POLICY "group_tool_coverages_written_by_platform" ON "billing"."group_tool_coverages" AS PERMISSIVE FOR ALL TO public USING (current_setting('app.is_platform', true) = 'on') WITH CHECK (current_setting('app.is_platform', true) = 'on');--> statement-breakpoint
CREATE POLICY "payments_of_their_payer" ON "billing"."payments" AS PERMISSIVE FOR ALL TO public USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid or group_id = nullif(current_setting('app.group_id', true), '')::uuid or current_setting('app.is_platform', true) = 'on') WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid or group_id = nullif(current_setting('app.group_id', true), '')::uuid or current_setting('app.is_platform', true) = 'on');--> statement-breakpoint
CREATE POLICY "tenant_subscription_tools_of_active_tenant" ON "billing"."tenant_subscription_tools" AS PERMISSIVE FOR ALL TO public USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid or current_setting('app.is_platform', true) = 'on') WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid or current_setting('app.is_platform', true) = 'on');--> statement-breakpoint
CREATE POLICY "tenant_subscription_tools_readable_by_their_group" ON "billing"."tenant_subscription_tools" AS PERMISSIVE FOR SELECT TO public USING (tenant_id in (select tenant_id from groups.pharmacy_memberships where group_id = nullif(current_setting('app.group_id', true), '')::uuid and (left_at is null or coverage_ends_at > now())));--> statement-breakpoint
CREATE POLICY "tenant_subscriptions_of_active_tenant" ON "billing"."tenant_subscriptions" AS PERMISSIVE FOR ALL TO public USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid or current_setting('app.is_platform', true) = 'on') WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid or current_setting('app.is_platform', true) = 'on');--> statement-breakpoint
CREATE POLICY "tenant_subscriptions_readable_by_their_group" ON "billing"."tenant_subscriptions" AS PERMISSIVE FOR SELECT TO public USING (tenant_id in (select tenant_id from groups.pharmacy_memberships where group_id = nullif(current_setting('app.group_id', true), '')::uuid and (left_at is null or coverage_ends_at > now())));--> statement-breakpoint
CREATE POLICY "tool_prices_readable_by_everyone" ON "billing"."tool_prices" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "tool_prices_written_by_platform" ON "billing"."tool_prices" AS PERMISSIVE FOR ALL TO public USING (current_setting('app.is_platform', true) = 'on') WITH CHECK (current_setting('app.is_platform', true) = 'on');
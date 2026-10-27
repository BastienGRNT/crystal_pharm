CREATE TABLE "billing"."group_contract_versions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"group_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"payment_method" text NOT NULL,
	"billing_mode" text NOT NULL,
	"flat_rate_monthly_price_cents" integer,
	"coverages" jsonb NOT NULL,
	"starts_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ends_at" timestamp with time zone,
	CONSTRAINT "group_contract_versions_number_per_group" UNIQUE("group_id","version_number")
);
--> statement-breakpoint
ALTER TABLE "billing"."group_contract_versions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "billing"."offer_version_tools" (
	"offer_version_id" uuid NOT NULL,
	"tool_key" text NOT NULL,
	CONSTRAINT "offer_version_tools_offer_version_id_tool_key_pk" PRIMARY KEY("offer_version_id","tool_key")
);
--> statement-breakpoint
ALTER TABLE "billing"."offer_version_tools" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "billing"."offer_versions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"offer_key" text NOT NULL,
	"version_number" integer NOT NULL,
	"monthly_price_cents" integer NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "offer_versions_number_per_offer" UNIQUE("offer_key","version_number"),
	CONSTRAINT "offer_versions_price_is_positive" CHECK (monthly_price_cents >= 0)
);
--> statement-breakpoint
ALTER TABLE "billing"."offer_versions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "billing"."offers" (
	"offer_key" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "billing"."offers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "billing"."price_agreements" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid,
	"group_id" uuid,
	"offer_key" text NOT NULL,
	"monthly_price_cents" integer NOT NULL,
	"starts_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ends_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "price_agreements_have_one_beneficiary" CHECK ((tenant_id is null) <> (group_id is null)),
	CONSTRAINT "price_agreements_price_is_positive" CHECK (monthly_price_cents >= 0)
);
--> statement-breakpoint
ALTER TABLE "billing"."price_agreements" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "billing"."tenant_subscription_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	"offer_version_id" uuid NOT NULL,
	"next_offer_version_id" uuid,
	"billed_monthly_price_cents" integer NOT NULL,
	"price_agreement_id" uuid,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ends_at" timestamp with time zone,
	CONSTRAINT "tenant_subscription_items_price_is_positive" CHECK (billed_monthly_price_cents >= 0)
);
--> statement-breakpoint
ALTER TABLE "billing"."tenant_subscription_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "billing"."tenant_tool_access" (
	"tenant_id" uuid NOT NULL,
	"tool_key" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"paid_until" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"granted_by" text NOT NULL,
	CONSTRAINT "tenant_tool_access_tenant_id_tool_key_granted_by_pk" PRIMARY KEY("tenant_id","tool_key","granted_by")
);
--> statement-breakpoint
ALTER TABLE "billing"."tenant_tool_access" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "billing"."payments" ADD COLUMN "subscription_id" uuid;--> statement-breakpoint
ALTER TABLE "billing"."payments" ADD COLUMN "attempt_number" integer;--> statement-breakpoint
ALTER TABLE "billing"."tenant_subscriptions" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "billing"."tenant_subscriptions" ADD COLUMN "failed_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "billing"."tenant_subscriptions" ADD COLUMN "first_failed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "billing"."tenant_subscriptions" ADD COLUMN "next_retry_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "billing"."group_contract_versions" ADD CONSTRAINT "group_contract_versions_group_id_pharmacy_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "groups"."pharmacy_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing"."offer_version_tools" ADD CONSTRAINT "offer_version_tools_offer_version_id_offer_versions_id_fk" FOREIGN KEY ("offer_version_id") REFERENCES "billing"."offer_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing"."offer_versions" ADD CONSTRAINT "offer_versions_offer_key_offers_offer_key_fk" FOREIGN KEY ("offer_key") REFERENCES "billing"."offers"("offer_key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing"."price_agreements" ADD CONSTRAINT "price_agreements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "pharmacy"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing"."price_agreements" ADD CONSTRAINT "price_agreements_group_id_pharmacy_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "groups"."pharmacy_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing"."price_agreements" ADD CONSTRAINT "price_agreements_offer_key_offers_offer_key_fk" FOREIGN KEY ("offer_key") REFERENCES "billing"."offers"("offer_key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing"."tenant_subscription_items" ADD CONSTRAINT "tenant_subscription_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "pharmacy"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing"."tenant_subscription_items" ADD CONSTRAINT "tenant_subscription_items_subscription_id_tenant_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "billing"."tenant_subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing"."tenant_subscription_items" ADD CONSTRAINT "tenant_subscription_items_offer_version_id_offer_versions_id_fk" FOREIGN KEY ("offer_version_id") REFERENCES "billing"."offer_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing"."tenant_subscription_items" ADD CONSTRAINT "tenant_subscription_items_next_offer_version_id_offer_versions_id_fk" FOREIGN KEY ("next_offer_version_id") REFERENCES "billing"."offer_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing"."tenant_subscription_items" ADD CONSTRAINT "tenant_subscription_items_price_agreement_id_price_agreements_id_fk" FOREIGN KEY ("price_agreement_id") REFERENCES "billing"."price_agreements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing"."tenant_tool_access" ADD CONSTRAINT "tenant_tool_access_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "pharmacy"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "group_contract_versions_group_id_index" ON "billing"."group_contract_versions" USING btree ("group_id","ends_at");--> statement-breakpoint
CREATE INDEX "price_agreements_tenant_id_index" ON "billing"."price_agreements" USING btree ("tenant_id","offer_key");--> statement-breakpoint
CREATE INDEX "price_agreements_group_id_index" ON "billing"."price_agreements" USING btree ("group_id","offer_key");--> statement-breakpoint
CREATE INDEX "tenant_subscription_items_tenant_id_index" ON "billing"."tenant_subscription_items" USING btree ("tenant_id","subscription_id");--> statement-breakpoint
CREATE INDEX "tenant_subscription_items_next_version_index" ON "billing"."tenant_subscription_items" USING btree ("next_offer_version_id");--> statement-breakpoint
CREATE INDEX "tenant_tool_access_tenant_id_ends_at_index" ON "billing"."tenant_tool_access" USING btree ("tenant_id","ends_at");--> statement-breakpoint
ALTER TABLE "billing"."payments" ADD CONSTRAINT "payments_subscription_id_tenant_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "billing"."tenant_subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tenant_subscriptions_due_index" ON "billing"."tenant_subscriptions" USING btree ("status","billed_until");--> statement-breakpoint
ALTER TABLE "billing"."payments" ADD CONSTRAINT "payments_provider_payment_reference_unique" UNIQUE("provider_payment_reference");--> statement-breakpoint
CREATE POLICY "group_contract_versions_readable_by_their_group_and_pharmacies" ON "billing"."group_contract_versions" AS PERMISSIVE FOR SELECT TO public USING (group_id = nullif(current_setting('app.group_id', true), '')::uuid or current_setting('app.is_platform', true) = 'on' or group_id in (
	select group_id from groups.pharmacy_memberships where tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid
	union select group_id from groups.pharmacy_invitations where email = nullif(current_setting('app.account_email', true), '') or token_hash = nullif(current_setting('app.invitation_token_hash', true), '')));--> statement-breakpoint
CREATE POLICY "group_contract_versions_written_by_platform" ON "billing"."group_contract_versions" AS PERMISSIVE FOR ALL TO public USING (current_setting('app.is_platform', true) = 'on') WITH CHECK (current_setting('app.is_platform', true) = 'on');--> statement-breakpoint
CREATE POLICY "offer_version_tools_readable_by_everyone" ON "billing"."offer_version_tools" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "offer_version_tools_published_by_platform" ON "billing"."offer_version_tools" AS PERMISSIVE FOR INSERT TO public WITH CHECK (current_setting('app.is_platform', true) = 'on');--> statement-breakpoint
CREATE POLICY "offer_versions_readable_by_everyone" ON "billing"."offer_versions" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "offer_versions_published_by_platform" ON "billing"."offer_versions" AS PERMISSIVE FOR INSERT TO public WITH CHECK (current_setting('app.is_platform', true) = 'on');--> statement-breakpoint
CREATE POLICY "offers_readable_by_everyone" ON "billing"."offers" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "offers_written_by_platform" ON "billing"."offers" AS PERMISSIVE FOR ALL TO public USING (current_setting('app.is_platform', true) = 'on') WITH CHECK (current_setting('app.is_platform', true) = 'on');--> statement-breakpoint
CREATE POLICY "price_agreements_readable_by_their_beneficiary" ON "billing"."price_agreements" AS PERMISSIVE FOR SELECT TO public USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid or group_id = nullif(current_setting('app.group_id', true), '')::uuid or current_setting('app.is_platform', true) = 'on' or group_id in (
	select group_id from groups.pharmacy_memberships where tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid
	union select group_id from groups.pharmacy_invitations where email = nullif(current_setting('app.account_email', true), '') or token_hash = nullif(current_setting('app.invitation_token_hash', true), '')));--> statement-breakpoint
CREATE POLICY "price_agreements_written_by_platform" ON "billing"."price_agreements" AS PERMISSIVE FOR ALL TO public USING (current_setting('app.is_platform', true) = 'on') WITH CHECK (current_setting('app.is_platform', true) = 'on');--> statement-breakpoint
CREATE POLICY "tenant_subscription_items_of_active_tenant" ON "billing"."tenant_subscription_items" AS PERMISSIVE FOR ALL TO public USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid or current_setting('app.is_platform', true) = 'on') WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid or current_setting('app.is_platform', true) = 'on');--> statement-breakpoint
CREATE POLICY "tenant_subscription_items_readable_by_their_group" ON "billing"."tenant_subscription_items" AS PERMISSIVE FOR SELECT TO public USING (tenant_id in (select tenant_id from groups.pharmacy_memberships where group_id = nullif(current_setting('app.group_id', true), '')::uuid and (left_at is null or coverage_ends_at > now())));--> statement-breakpoint
CREATE POLICY "tenant_tool_access_of_active_tenant" ON "billing"."tenant_tool_access" AS PERMISSIVE FOR ALL TO public USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid or current_setting('app.is_platform', true) = 'on') WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid or current_setting('app.is_platform', true) = 'on');--> statement-breakpoint
CREATE POLICY "tenant_tool_access_readable_by_their_group" ON "billing"."tenant_tool_access" AS PERMISSIVE FOR SELECT TO public USING (tenant_id in (select tenant_id from groups.pharmacy_memberships where group_id = nullif(current_setting('app.group_id', true), '')::uuid and (left_at is null or coverage_ends_at > now())));
CREATE TABLE "billing"."flat_rate_offers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"pharmacy_quota" integer NOT NULL,
	"monthly_price_cents" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "flat_rate_offers_are_positive" CHECK (pharmacy_quota > 0 and monthly_price_cents >= 0)
);
--> statement-breakpoint
ALTER TABLE "billing"."flat_rate_offers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "billing"."invoice_sequences" (
	"year" integer PRIMARY KEY NOT NULL,
	"last_number" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "billing"."invoice_sequences" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "billing"."invoices" (
	"id" uuid PRIMARY KEY NOT NULL,
	"number" text NOT NULL,
	"kind" text NOT NULL,
	"tenant_id" uuid,
	"group_id" uuid,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"period_start" timestamp with time zone,
	"period_end" timestamp with time zone,
	"customer_name" text NOT NULL,
	"customer_address_lines" jsonb NOT NULL,
	"lines" jsonb NOT NULL,
	"subtotal_cents" integer NOT NULL,
	"vat_rate_percent" integer NOT NULL,
	"vat_cents" integer NOT NULL,
	"total_cents" integer NOT NULL,
	"status" text NOT NULL,
	"payment_method" text NOT NULL,
	"payment_id" uuid,
	"credited_invoice_id" uuid,
	"paid_at" timestamp with time zone,
	CONSTRAINT "invoices_number_unique" UNIQUE("number")
);
--> statement-breakpoint
ALTER TABLE "billing"."invoices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "billing"."group_contracts" ADD COLUMN "billing_mode" text DEFAULT 'usage' NOT NULL;--> statement-breakpoint
ALTER TABLE "billing"."group_contracts" ADD COLUMN "flat_rate_monthly_price_cents" integer;--> statement-breakpoint
ALTER TABLE "billing"."group_contracts" ADD COLUMN "flat_rate_offer_id" uuid;--> statement-breakpoint
ALTER TABLE "billing"."group_contracts" ADD COLUMN "billed_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "billing"."tenant_subscriptions" ADD COLUMN "billed_until" timestamp with time zone DEFAULT now() + interval '1 month' NOT NULL;--> statement-breakpoint
ALTER TABLE "billing"."invoices" ADD CONSTRAINT "invoices_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "pharmacy"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing"."invoices" ADD CONSTRAINT "invoices_group_id_pharmacy_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "groups"."pharmacy_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing"."invoices" ADD CONSTRAINT "invoices_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "billing"."payments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invoices_tenant_id_index" ON "billing"."invoices" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "invoices_group_id_index" ON "billing"."invoices" USING btree ("group_id");--> statement-breakpoint
ALTER TABLE "billing"."group_contracts" ADD CONSTRAINT "group_contracts_flat_rate_offer_id_flat_rate_offers_id_fk" FOREIGN KEY ("flat_rate_offer_id") REFERENCES "billing"."flat_rate_offers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "flat_rate_offers_readable_by_everyone" ON "billing"."flat_rate_offers" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "flat_rate_offers_written_by_platform" ON "billing"."flat_rate_offers" AS PERMISSIVE FOR ALL TO public USING (current_setting('app.is_platform', true) = 'on') WITH CHECK (current_setting('app.is_platform', true) = 'on');--> statement-breakpoint
CREATE POLICY "invoice_sequences_of_platform" ON "billing"."invoice_sequences" AS PERMISSIVE FOR ALL TO public USING (current_setting('app.is_platform', true) = 'on') WITH CHECK (current_setting('app.is_platform', true) = 'on');--> statement-breakpoint
CREATE POLICY "invoices_readable_by_their_customer" ON "billing"."invoices" AS PERMISSIVE FOR SELECT TO public USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid or group_id = nullif(current_setting('app.group_id', true), '')::uuid or current_setting('app.is_platform', true) = 'on');--> statement-breakpoint
CREATE POLICY "invoices_written_by_platform" ON "billing"."invoices" AS PERMISSIVE FOR ALL TO public USING (current_setting('app.is_platform', true) = 'on') WITH CHECK (current_setting('app.is_platform', true) = 'on');
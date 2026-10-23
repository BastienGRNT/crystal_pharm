ALTER TABLE "billing"."catalog_settings" ADD COLUMN "annual_free_months" integer DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE "billing"."checkouts" ADD COLUMN "billing_period" text DEFAULT 'monthly' NOT NULL;--> statement-breakpoint
ALTER TABLE "billing"."group_contracts" ADD COLUMN "billing_period" text DEFAULT 'monthly' NOT NULL;--> statement-breakpoint
ALTER TABLE "billing"."tenant_subscriptions" ADD COLUMN "billing_period" text DEFAULT 'monthly' NOT NULL;--> statement-breakpoint
ALTER TABLE "billing"."tenant_subscriptions" ADD COLUMN "next_billing_period" text;--> statement-breakpoint
ALTER TABLE "billing"."catalog_settings" ADD CONSTRAINT "catalog_settings_free_months_fit_in_a_year" CHECK (annual_free_months between 0 and 11);
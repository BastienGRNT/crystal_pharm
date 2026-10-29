CREATE TABLE "planning"."employee_terms" (
	"tenant_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"weekly_contract_minutes" integer,
	"hourly_rate_cents" integer,
	"is_student" boolean DEFAULT false NOT NULL,
	"availability_validation" text DEFAULT 'manual' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "employee_terms_tenant_id_employee_id_pk" PRIMARY KEY("tenant_id","employee_id"),
	CONSTRAINT "employee_terms_contract_minutes_positive" CHECK ("planning"."employee_terms"."weekly_contract_minutes" is null or "planning"."employee_terms"."weekly_contract_minutes" > 0),
	CONSTRAINT "employee_terms_hourly_rate_not_negative" CHECK ("planning"."employee_terms"."hourly_rate_cents" is null or "planning"."employee_terms"."hourly_rate_cents" >= 0),
	CONSTRAINT "employee_terms_availability_validation_is_known" CHECK (availability_validation in ('automatic', 'manual'))
);
--> statement-breakpoint
ALTER TABLE "planning"."employee_terms" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "planning"."planned_weeks" (
	"tenant_id" uuid NOT NULL,
	"monday_date" date NOT NULL,
	"status" text NOT NULL,
	"published_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "planned_weeks_tenant_id_monday_date_pk" PRIMARY KEY("tenant_id","monday_date"),
	CONSTRAINT "planned_weeks_status_is_known" CHECK (status in ('draft', 'published'))
);
--> statement-breakpoint
ALTER TABLE "planning"."planned_weeks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "planning"."planning_settings" (
	"tenant_id" uuid PRIMARY KEY NOT NULL,
	"minimum_pharmacists_present" integer DEFAULT 1 NOT NULL,
	"minimum_people_present" integer DEFAULT 2 NOT NULL,
	"minimum_shift_minutes" integer DEFAULT 120 NOT NULL,
	"maximum_shifts_per_day" integer DEFAULT 2 NOT NULL,
	"minimum_rest_minutes" integer DEFAULT 660 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "planning"."planning_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "planning"."employee_terms" ADD CONSTRAINT "employee_terms_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "pharmacy"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "employee_terms_of_active_tenant" ON "planning"."employee_terms" AS PERMISSIVE FOR ALL TO public USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "planned_weeks_of_active_tenant" ON "planning"."planned_weeks" AS PERMISSIVE FOR ALL TO public USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "planning_settings_of_active_tenant" ON "planning"."planning_settings" AS PERMISSIVE FOR ALL TO public USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
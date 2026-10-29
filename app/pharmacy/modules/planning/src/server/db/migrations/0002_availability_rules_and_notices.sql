CREATE TABLE "planning"."availability_rules" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"weekday" smallint,
	"date" date,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"status" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "availability_rules_kind_is_known" CHECK (kind in ('unavailable', 'course', 'available')),
	CONSTRAINT "availability_rules_status_is_known" CHECK (status in ('pending', 'approved', 'declined')),
	CONSTRAINT "availability_rules_weekday_or_date" CHECK (("planning"."availability_rules"."weekday" is null) <> ("planning"."availability_rules"."date" is null)),
	CONSTRAINT "availability_rules_weekday_is_valid" CHECK ("planning"."availability_rules"."weekday" is null or "planning"."availability_rules"."weekday" between 0 and 6),
	CONSTRAINT "availability_rules_ends_after_start" CHECK ("planning"."availability_rules"."start_time" < "planning"."availability_rules"."end_time")
);
--> statement-breakpoint
ALTER TABLE "planning"."availability_rules" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "planning"."planning_notices" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"recipient_account_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"message" text NOT NULL,
	"link_pathname" text NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "planning_notices_kind_is_known" CHECK (kind in ('availability-requested', 'availability-decided'))
);
--> statement-breakpoint
ALTER TABLE "planning"."planning_notices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "planning"."availability_rules" ADD CONSTRAINT "availability_rules_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "pharmacy"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "availability_rules_tenant_id_employee_id_index" ON "planning"."availability_rules" USING btree ("tenant_id","employee_id");--> statement-breakpoint
CREATE INDEX "availability_rules_tenant_id_status_index" ON "planning"."availability_rules" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "planning_notices_tenant_id_recipient_created_index" ON "planning"."planning_notices" USING btree ("tenant_id","recipient_account_id","created_at");--> statement-breakpoint
CREATE POLICY "availability_rules_of_active_tenant" ON "planning"."availability_rules" AS PERMISSIVE FOR ALL TO public USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "planning_notices_of_active_tenant" ON "planning"."planning_notices" AS PERMISSIVE FOR ALL TO public USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
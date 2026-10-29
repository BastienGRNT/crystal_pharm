CREATE TABLE "planning"."peak_windows" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"weekday" smallint NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"required_count" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "peak_windows_weekday_is_valid" CHECK ("planning"."peak_windows"."weekday" between 0 and 6),
	CONSTRAINT "peak_windows_ends_after_start" CHECK ("planning"."peak_windows"."start_time" < "planning"."peak_windows"."end_time"),
	CONSTRAINT "peak_windows_required_count_positive" CHECK ("planning"."peak_windows"."required_count" > 0)
);
--> statement-breakpoint
ALTER TABLE "planning"."peak_windows" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "planning"."week_template_shifts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"template_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"weekday" smallint NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	CONSTRAINT "week_template_shifts_weekday_is_valid" CHECK ("planning"."week_template_shifts"."weekday" between 0 and 6),
	CONSTRAINT "week_template_shifts_ends_after_start" CHECK ("planning"."week_template_shifts"."start_time" < "planning"."week_template_shifts"."end_time")
);
--> statement-breakpoint
ALTER TABLE "planning"."week_template_shifts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "planning"."week_templates" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"rotation" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "week_templates_rotation_is_known" CHECK ("planning"."week_templates"."rotation" is null or "planning"."week_templates"."rotation" in ('A', 'B'))
);
--> statement-breakpoint
ALTER TABLE "planning"."week_templates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "planning"."week_template_shifts" ADD CONSTRAINT "week_template_shifts_template_id_week_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "planning"."week_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planning"."week_template_shifts" ADD CONSTRAINT "week_template_shifts_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "pharmacy"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "peak_windows_tenant_id_weekday_index" ON "planning"."peak_windows" USING btree ("tenant_id","weekday");--> statement-breakpoint
CREATE INDEX "week_template_shifts_tenant_id_template_id_index" ON "planning"."week_template_shifts" USING btree ("tenant_id","template_id");--> statement-breakpoint
CREATE INDEX "week_templates_tenant_id_index" ON "planning"."week_templates" USING btree ("tenant_id");--> statement-breakpoint
CREATE POLICY "peak_windows_of_active_tenant" ON "planning"."peak_windows" AS PERMISSIVE FOR ALL TO public USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "week_template_shifts_of_active_tenant" ON "planning"."week_template_shifts" AS PERMISSIVE FOR ALL TO public USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "week_templates_of_active_tenant" ON "planning"."week_templates" AS PERMISSIVE FOR ALL TO public USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
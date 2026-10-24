CREATE SCHEMA IF NOT EXISTS "planning";
--> statement-breakpoint
CREATE TABLE "planning"."absences" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"first_date" date NOT NULL,
	"last_date" date NOT NULL,
	"kind" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "absences_last_date_not_before_first" CHECK ("planning"."absences"."last_date" >= "planning"."absences"."first_date"),
	CONSTRAINT "absences_kind_is_known" CHECK (kind in ('Congé', 'RTT', 'Arrêt maladie', 'Autre'))
);
--> statement-breakpoint
ALTER TABLE "planning"."absences" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "planning"."shifts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shifts_end_after_start" CHECK ("planning"."shifts"."end_time" > "planning"."shifts"."start_time")
);
--> statement-breakpoint
ALTER TABLE "planning"."shifts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "planning"."absences" ADD CONSTRAINT "absences_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "pharmacy"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planning"."shifts" ADD CONSTRAINT "shifts_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "pharmacy"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "absences_tenant_id_first_date_index" ON "planning"."absences" USING btree ("tenant_id","first_date");--> statement-breakpoint
CREATE INDEX "shifts_tenant_id_date_index" ON "planning"."shifts" USING btree ("tenant_id","date");--> statement-breakpoint
CREATE POLICY "absences_of_active_tenant" ON "planning"."absences" AS PERMISSIVE FOR ALL TO public USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "shifts_of_active_tenant" ON "planning"."shifts" AS PERMISSIVE FOR ALL TO public USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
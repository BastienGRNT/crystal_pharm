CREATE TABLE "planning"."planned_activities" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"label" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "planned_activities_kind_is_known" CHECK (kind in ('training', 'on-call')),
	CONSTRAINT "planned_activities_ends_after_start" CHECK ("planning"."planned_activities"."start_time" < "planning"."planned_activities"."end_time")
);
--> statement-breakpoint
ALTER TABLE "planning"."planned_activities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "planning"."planning_notices" DROP CONSTRAINT "planning_notices_kind_is_known";--> statement-breakpoint
ALTER TABLE "planning"."absences" ADD COLUMN "status" text DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE "planning"."absences" ADD COLUMN "note" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "planning"."absences" ADD COLUMN "decided_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "planning"."planned_activities" ADD CONSTRAINT "planned_activities_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "pharmacy"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "planned_activities_tenant_id_date_index" ON "planning"."planned_activities" USING btree ("tenant_id","date");--> statement-breakpoint
CREATE INDEX "absences_tenant_id_status_index" ON "planning"."absences" USING btree ("tenant_id","status");--> statement-breakpoint
ALTER TABLE "planning"."absences" ADD CONSTRAINT "absences_status_is_known" CHECK (status in ('pending', 'approved', 'declined'));--> statement-breakpoint
ALTER TABLE "planning"."planning_notices" ADD CONSTRAINT "planning_notices_kind_is_known" CHECK (kind in ('availability-requested', 'availability-decided', 'leave-requested', 'leave-decided'));--> statement-breakpoint
CREATE POLICY "planned_activities_of_active_tenant" ON "planning"."planned_activities" AS PERMISSIVE FOR ALL TO public USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE TABLE "pharmacy"."tenant_member_invitations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"email" text NOT NULL,
	"responsibility_keys" text[] NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_member_invitations_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "pharmacy"."tenant_member_invitations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "pharmacy"."tenant_memberships" ADD COLUMN "member_kind" text DEFAULT 'owner' NOT NULL;--> statement-breakpoint
ALTER TABLE "pharmacy"."tenant_memberships" ADD COLUMN "responsibility_keys" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "pharmacy"."tenant_memberships" ADD COLUMN "employee_id" uuid;--> statement-breakpoint
ALTER TABLE "pharmacy"."tenant_member_invitations" ADD CONSTRAINT "tenant_member_invitations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "pharmacy"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pharmacy"."tenant_member_invitations" ADD CONSTRAINT "tenant_member_invitations_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "pharmacy"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tenant_member_invitations_tenant_id_created_at_index" ON "pharmacy"."tenant_member_invitations" USING btree ("tenant_id","created_at");--> statement-breakpoint
ALTER TABLE "pharmacy"."tenant_memberships" ADD CONSTRAINT "tenant_memberships_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "pharmacy"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_memberships_one_counter_account_per_tenant" ON "pharmacy"."tenant_memberships" USING btree ("tenant_id") WHERE member_kind = 'counter';--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_memberships_one_account_per_employee" ON "pharmacy"."tenant_memberships" USING btree ("tenant_id","employee_id") WHERE employee_id is not null;--> statement-breakpoint
ALTER TABLE "pharmacy"."tenant_memberships" ADD CONSTRAINT "tenant_memberships_known_member_kind" CHECK (member_kind in ('owner', 'employee', 'counter'));--> statement-breakpoint
ALTER TABLE "pharmacy"."tenant_memberships" ADD CONSTRAINT "tenant_memberships_counter_without_employee" CHECK (member_kind <> 'counter' or employee_id is null);--> statement-breakpoint
CREATE POLICY "tenant_member_invitations_of_active_tenant_or_token" ON "pharmacy"."tenant_member_invitations" AS PERMISSIVE FOR ALL TO public USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid or token_hash = nullif(current_setting('app.invitation_token_hash', true), '') or current_setting('app.is_platform', true) = 'on') WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid or current_setting('app.is_platform', true) = 'on');
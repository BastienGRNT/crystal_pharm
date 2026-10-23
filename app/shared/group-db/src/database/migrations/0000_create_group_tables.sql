CREATE SCHEMA IF NOT EXISTS "groups";
--> statement-breakpoint
CREATE TABLE "groups"."group_member_invitations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"group_id" uuid NOT NULL,
	"email" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"accepted_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "group_member_invitations_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "groups"."group_member_invitations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "groups"."group_members" (
	"group_id" uuid NOT NULL,
	"account_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "group_members_group_id_account_id_pk" PRIMARY KEY("group_id","account_id")
);
--> statement-breakpoint
ALTER TABLE "groups"."group_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "groups"."pharmacy_groups" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"contact_email" text,
	"pharmacy_quota" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pharmacy_groups_quota_is_positive" CHECK (pharmacy_quota >= 0)
);
--> statement-breakpoint
ALTER TABLE "groups"."pharmacy_groups" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "groups"."pharmacy_invitations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"group_id" uuid NOT NULL,
	"email" text NOT NULL,
	"pharmacy_name" text,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"accepted_at" timestamp with time zone,
	"accepted_tenant_id" uuid,
	"declined_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "pharmacy_invitations_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "groups"."pharmacy_invitations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "groups"."pharmacy_memberships" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone,
	"coverage_ends_at" timestamp with time zone,
	"ended_by" text
);
--> statement-breakpoint
ALTER TABLE "groups"."pharmacy_memberships" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "groups"."group_member_invitations" ADD CONSTRAINT "group_member_invitations_group_id_pharmacy_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "groups"."pharmacy_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups"."group_members" ADD CONSTRAINT "group_members_group_id_pharmacy_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "groups"."pharmacy_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups"."group_members" ADD CONSTRAINT "group_members_account_id_users_id_fk" FOREIGN KEY ("account_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups"."pharmacy_invitations" ADD CONSTRAINT "pharmacy_invitations_group_id_pharmacy_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "groups"."pharmacy_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups"."pharmacy_invitations" ADD CONSTRAINT "pharmacy_invitations_accepted_tenant_id_tenants_id_fk" FOREIGN KEY ("accepted_tenant_id") REFERENCES "pharmacy"."tenants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups"."pharmacy_memberships" ADD CONSTRAINT "pharmacy_memberships_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "pharmacy"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups"."pharmacy_memberships" ADD CONSTRAINT "pharmacy_memberships_group_id_pharmacy_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "groups"."pharmacy_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "group_member_invitations_group_id_index" ON "groups"."group_member_invitations" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "group_members_account_id_index" ON "groups"."group_members" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "pharmacy_invitations_group_id_index" ON "groups"."pharmacy_invitations" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "pharmacy_invitations_email_index" ON "groups"."pharmacy_invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "pharmacy_memberships_tenant_id_index" ON "groups"."pharmacy_memberships" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "pharmacy_memberships_group_id_index" ON "groups"."pharmacy_memberships" USING btree ("group_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pharmacy_memberships_one_current_group_per_tenant" ON "groups"."pharmacy_memberships" USING btree ("tenant_id") WHERE left_at is null;--> statement-breakpoint
CREATE POLICY "group_member_invitations_of_active_group_or_token" ON "groups"."group_member_invitations" AS PERMISSIVE FOR ALL TO public USING (group_id = nullif(current_setting('app.group_id', true), '')::uuid or current_setting('app.is_platform', true) = 'on' or token_hash = nullif(current_setting('app.invitation_token_hash', true), '')) WITH CHECK (group_id = nullif(current_setting('app.group_id', true), '')::uuid or current_setting('app.is_platform', true) = 'on' or token_hash = nullif(current_setting('app.invitation_token_hash', true), ''));--> statement-breakpoint
CREATE POLICY "group_members_of_active_group_or_account" ON "groups"."group_members" AS PERMISSIVE FOR ALL TO public USING (group_id = nullif(current_setting('app.group_id', true), '')::uuid or account_id = nullif(current_setting('app.account_id', true), '') or current_setting('app.is_platform', true) = 'on') WITH CHECK (group_id = nullif(current_setting('app.group_id', true), '')::uuid or current_setting('app.is_platform', true) = 'on'
				or (account_id = nullif(current_setting('app.account_id', true), '') and group_id in (select group_id from groups.group_member_invitations where token_hash = nullif(current_setting('app.invitation_token_hash', true), ''))));--> statement-breakpoint
CREATE POLICY "pharmacy_groups_readable_by_their_people" ON "groups"."pharmacy_groups" AS PERMISSIVE FOR SELECT TO public USING (id = nullif(current_setting('app.group_id', true), '')::uuid or current_setting('app.is_platform', true) = 'on'
				or id in (select group_id from groups.group_members where account_id = nullif(current_setting('app.account_id', true), ''))
				or id in (select group_id from groups.pharmacy_memberships where tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
				or id in (select group_id from groups.pharmacy_invitations where email = nullif(current_setting('app.account_email', true), '') or token_hash = nullif(current_setting('app.invitation_token_hash', true), ''))
				or id in (select group_id from groups.group_member_invitations where token_hash = nullif(current_setting('app.invitation_token_hash', true), '')));--> statement-breakpoint
CREATE POLICY "pharmacy_groups_written_by_platform" ON "groups"."pharmacy_groups" AS PERMISSIVE FOR ALL TO public USING (current_setting('app.is_platform', true) = 'on') WITH CHECK (current_setting('app.is_platform', true) = 'on');--> statement-breakpoint
CREATE POLICY "pharmacy_invitations_of_active_group_email_or_token" ON "groups"."pharmacy_invitations" AS PERMISSIVE FOR ALL TO public USING (group_id = nullif(current_setting('app.group_id', true), '')::uuid or current_setting('app.is_platform', true) = 'on' or email = nullif(current_setting('app.account_email', true), '') or token_hash = nullif(current_setting('app.invitation_token_hash', true), '')) WITH CHECK (group_id = nullif(current_setting('app.group_id', true), '')::uuid or current_setting('app.is_platform', true) = 'on' or email = nullif(current_setting('app.account_email', true), '') or token_hash = nullif(current_setting('app.invitation_token_hash', true), ''));--> statement-breakpoint
CREATE POLICY "pharmacy_memberships_of_active_group_or_tenant" ON "groups"."pharmacy_memberships" AS PERMISSIVE FOR ALL TO public USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid or group_id = nullif(current_setting('app.group_id', true), '')::uuid or current_setting('app.is_platform', true) = 'on') WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid or group_id = nullif(current_setting('app.group_id', true), '')::uuid or current_setting('app.is_platform', true) = 'on');
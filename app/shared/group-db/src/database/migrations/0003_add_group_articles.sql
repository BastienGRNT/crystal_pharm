CREATE TABLE "groups"."group_articles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"group_id" uuid NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "groups"."group_articles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "groups"."pharmacy_groups" ADD COLUMN "imposes_group_news" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "groups"."group_articles" ADD CONSTRAINT "group_articles_group_id_pharmacy_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "groups"."pharmacy_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "group_articles_group_id_published_at_index" ON "groups"."group_articles" USING btree ("group_id","published_at");--> statement-breakpoint
CREATE POLICY "group_articles_readable_by_their_group_and_member_pharmacies" ON "groups"."group_articles" AS PERMISSIVE FOR SELECT TO public USING (group_id = nullif(current_setting('app.group_id', true), '')::uuid or current_setting('app.is_platform', true) = 'on'
				or group_id in (select group_id from groups.pharmacy_memberships where tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid and left_at is null));--> statement-breakpoint
CREATE POLICY "group_articles_written_by_their_group" ON "groups"."group_articles" AS PERMISSIVE FOR ALL TO public USING (group_id = nullif(current_setting('app.group_id', true), '')::uuid or current_setting('app.is_platform', true) = 'on') WITH CHECK (group_id = nullif(current_setting('app.group_id', true), '')::uuid or current_setting('app.is_platform', true) = 'on');
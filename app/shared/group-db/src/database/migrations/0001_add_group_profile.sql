ALTER TABLE "groups"."pharmacy_groups" ADD COLUMN "logo_id" uuid;--> statement-breakpoint
ALTER TABLE "groups"."pharmacy_groups" ADD COLUMN "loyalty_card_image_id" uuid;--> statement-breakpoint
ALTER TABLE "groups"."pharmacy_groups" ADD COLUMN "loyalty_card_url" text;--> statement-breakpoint
ALTER TABLE "groups"."pharmacy_groups" ADD COLUMN "loyalty_card_message" text;--> statement-breakpoint
CREATE POLICY "pharmacy_groups_profile_updated_by_its_members" ON "groups"."pharmacy_groups" AS PERMISSIVE FOR UPDATE TO public USING (id = nullif(current_setting('app.group_id', true), '')::uuid) WITH CHECK (id = nullif(current_setting('app.group_id', true), '')::uuid);
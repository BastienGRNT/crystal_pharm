ALTER TABLE "platform_auth"."users" ADD COLUMN "first_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_auth"."users" ADD COLUMN "last_name" text DEFAULT '' NOT NULL;
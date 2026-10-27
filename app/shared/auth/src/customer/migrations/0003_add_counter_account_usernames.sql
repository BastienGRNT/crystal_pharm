ALTER TABLE "auth"."users" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "auth"."users" ADD COLUMN "display_username" text;--> statement-breakpoint
ALTER TABLE "auth"."users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");
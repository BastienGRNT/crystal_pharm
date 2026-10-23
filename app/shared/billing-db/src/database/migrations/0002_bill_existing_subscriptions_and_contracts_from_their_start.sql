-- Custom SQL migration file, put your code below! --
UPDATE "billing"."tenant_subscriptions" SET "billed_until" = "started_at" + interval '1 month';--> statement-breakpoint
UPDATE "billing"."group_contracts" SET "billed_until" = "activated_at" + interval '1 month' WHERE "status" = 'active' AND "activated_at" IS NOT NULL;

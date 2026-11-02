ALTER TABLE "planning"."planning_settings" ADD COLUMN "overtime_weekly_threshold_minutes" integer DEFAULT 2100 NOT NULL;--> statement-breakpoint
ALTER TABLE "planning"."planning_settings" ADD COLUMN "overtime_first_band_minutes" integer DEFAULT 480 NOT NULL;--> statement-breakpoint
ALTER TABLE "planning"."planning_settings" ADD COLUMN "overtime_first_band_rate_percent" integer DEFAULT 25 NOT NULL;--> statement-breakpoint
ALTER TABLE "planning"."planning_settings" ADD COLUMN "overtime_beyond_rate_percent" integer DEFAULT 50 NOT NULL;
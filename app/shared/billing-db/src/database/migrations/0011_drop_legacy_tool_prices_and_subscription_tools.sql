DROP POLICY "tenant_subscription_tools_of_active_tenant" ON "billing"."tenant_subscription_tools" CASCADE;--> statement-breakpoint
DROP POLICY "tenant_subscription_tools_readable_by_their_group" ON "billing"."tenant_subscription_tools" CASCADE;--> statement-breakpoint
DROP TABLE "billing"."tenant_subscription_tools" CASCADE;--> statement-breakpoint
DROP POLICY "tool_prices_readable_by_everyone" ON "billing"."tool_prices" CASCADE;--> statement-breakpoint
DROP POLICY "tool_prices_written_by_platform" ON "billing"."tool_prices" CASCADE;--> statement-breakpoint
DROP TABLE "billing"."tool_prices" CASCADE;--> statement-breakpoint
ALTER TABLE "billing"."catalog_settings" DROP COLUMN "pack_monthly_price_cents";
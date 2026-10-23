-- Rendez-vous et Ordonnances ne se vendent plus seuls : ils sont compris avec
-- le site ou le planning. Leurs prix, leurs prises en charge et leurs lignes
-- d'abonnement n'ont plus de sens.
DELETE FROM "billing"."tool_prices" WHERE "tool_key" IN ('booking', 'prescriptions');
--> statement-breakpoint
DELETE FROM "billing"."group_tool_coverages" WHERE "tool_key" IN ('booking', 'prescriptions');
--> statement-breakpoint
DELETE FROM "billing"."tenant_subscription_tools" WHERE "tool_key" IN ('booking', 'prescriptions');

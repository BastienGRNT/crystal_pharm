-- Chaque Tool vendu devient une offre, avec une version 1 au même prix.
INSERT INTO billing.offers (offer_key, label)
SELECT tool_key,
	CASE tool_key WHEN 'site' THEN 'Site internet' WHEN 'planning' THEN 'Planning' WHEN 'booking' THEN 'Rendez-vous' WHEN 'prescriptions' THEN 'Ordonnances' ELSE tool_key END
FROM billing.tool_prices
ON CONFLICT (offer_key) DO NOTHING;--> statement-breakpoint
INSERT INTO billing.offer_versions (id, offer_key, version_number, monthly_price_cents)
SELECT gen_random_uuid(), tool_key, 1, monthly_price_cents
FROM billing.tool_prices
WHERE NOT EXISTS (SELECT 1 FROM billing.offer_versions WHERE offer_versions.offer_key = tool_prices.tool_key);--> statement-breakpoint
INSERT INTO billing.offer_version_tools (offer_version_id, tool_key)
SELECT id, offer_key FROM billing.offer_versions
WHERE offer_key IN (SELECT tool_key FROM billing.tool_prices)
ON CONFLICT DO NOTHING;--> statement-breakpoint

-- Le pack devient une offre : tous les Tools payants, au prix du pack.
INSERT INTO billing.offers (offer_key, label)
SELECT 'pack', 'Pack' FROM billing.catalog_settings WHERE pack_monthly_price_cents IS NOT NULL
ON CONFLICT (offer_key) DO NOTHING;--> statement-breakpoint
INSERT INTO billing.offer_versions (id, offer_key, version_number, monthly_price_cents)
SELECT gen_random_uuid(), 'pack', 1, pack_monthly_price_cents FROM billing.catalog_settings
WHERE pack_monthly_price_cents IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM billing.offer_versions WHERE offer_key = 'pack');--> statement-breakpoint
INSERT INTO billing.offer_version_tools (offer_version_id, tool_key)
SELECT offer_versions.id, tool_prices.tool_key
FROM billing.offer_versions CROSS JOIN billing.tool_prices
WHERE offer_versions.offer_key = 'pack' AND tool_prices.monthly_price_cents > 0
ON CONFLICT DO NOTHING;--> statement-breakpoint

-- Une pharmacie qui avait tous les Tools payants au prix du pack garde ce prix : une seule ligne « pack ».
INSERT INTO billing.tenant_subscription_items (id, tenant_id, subscription_id, offer_version_id, billed_monthly_price_cents, started_at)
SELECT gen_random_uuid(), subscriptions.tenant_id, subscriptions.id, pack_version.id, pack_version.monthly_price_cents,
	(SELECT min(subscription_tools.added_at) FROM billing.tenant_subscription_tools AS subscription_tools
		WHERE subscription_tools.subscription_id = subscriptions.id AND subscription_tools.ends_at IS NULL)
FROM billing.tenant_subscriptions AS subscriptions
JOIN billing.offer_versions AS pack_version ON pack_version.offer_key = 'pack' AND pack_version.version_number = 1
WHERE (SELECT count(*) FROM billing.tool_prices WHERE monthly_price_cents > 0) >= 2
	AND pack_version.monthly_price_cents < (SELECT sum(monthly_price_cents) FROM billing.tool_prices)
	AND NOT EXISTS (
		SELECT 1 FROM billing.tool_prices AS paid_tool
		WHERE paid_tool.monthly_price_cents > 0 AND NOT EXISTS (
			SELECT 1 FROM billing.tenant_subscription_tools AS active_tool
			WHERE active_tool.subscription_id = subscriptions.id AND active_tool.tool_key = paid_tool.tool_key AND active_tool.ends_at IS NULL
		)
	);--> statement-breakpoint

-- Les autres Tools d'un abonnement deviennent des lignes d'abonnement, au prix de la version 1.
INSERT INTO billing.tenant_subscription_items (id, tenant_id, subscription_id, offer_version_id, billed_monthly_price_cents, started_at, ends_at)
SELECT gen_random_uuid(), subscription_tools.tenant_id, subscription_tools.subscription_id, offer_versions.id, offer_versions.monthly_price_cents, subscription_tools.added_at, subscription_tools.ends_at
FROM billing.tenant_subscription_tools AS subscription_tools
JOIN billing.offer_versions ON offer_versions.offer_key = subscription_tools.tool_key AND offer_versions.version_number = 1
WHERE NOT EXISTS (
	SELECT 1 FROM billing.tenant_subscription_items AS pack_item
	JOIN billing.offer_versions AS pack_version ON pack_version.id = pack_item.offer_version_id AND pack_version.offer_key = 'pack'
	WHERE pack_item.subscription_id = subscription_tools.subscription_id
);--> statement-breakpoint

UPDATE billing.tenant_subscriptions SET status = 'ended' WHERE ends_at IS NOT NULL AND ends_at <= now();--> statement-breakpoint

-- Le contrat de chaque groupement devient sa version 1.
INSERT INTO billing.group_contract_versions (id, group_id, version_number, payment_method, billing_mode, flat_rate_monthly_price_cents, coverages, starts_at)
SELECT gen_random_uuid(), contracts.group_id, 1, contracts.payment_method, contracts.billing_mode, contracts.flat_rate_monthly_price_cents,
	coalesce((SELECT jsonb_agg(jsonb_build_object('toolKey', coverages.tool_key, 'discountPercent', coverages.discount_percent, 'groupSharePercent', coverages.group_share_percent))
		FROM billing.group_tool_coverages AS coverages WHERE coverages.group_id = contracts.group_id), '[]'::jsonb),
	coalesce(contracts.activated_at, contracts.created_at)
FROM billing.group_contracts AS contracts;--> statement-breakpoint

-- La lecture des droits d'un Tenant : une seule instruction, qui pose son propre contexte RLS.
CREATE FUNCTION billing.read_tool_access(requested_tenant_id uuid)
RETURNS TABLE (tool_key text, paid_until timestamptz, ends_at timestamptz)
LANGUAGE plpgsql
AS $$
BEGIN
	PERFORM set_config('app.tenant_id', requested_tenant_id::text, true);
	RETURN QUERY
	SELECT access.tool_key, access.paid_until, access.ends_at
	FROM billing.tenant_tool_access AS access
	WHERE access.tenant_id = requested_tenant_id
		AND access.starts_at <= now()
		AND access.ends_at > now() - interval '24 hours';
END;
$$;

-- Une offre est en vente tant que son Tool avait un prix au catalogue (le pack : un prix de pack) ; le catalogue ne porte plus que les mois offerts.
UPDATE billing.offers SET is_on_sale = false
WHERE offer_key <> 'pack' AND offer_key NOT IN (SELECT tool_key FROM billing.tool_prices);
--> statement-breakpoint
UPDATE billing.offers SET is_on_sale = false
WHERE offer_key = 'pack' AND NOT EXISTS (SELECT 1 FROM billing.catalog_settings WHERE pack_monthly_price_cents IS NOT NULL);

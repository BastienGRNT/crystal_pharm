-- Une table que le site affiche prévient `app/site` à chaque changement : la notification
-- ne part qu'au COMMIT, et rien ne part si la transaction est annulée.
CREATE FUNCTION content.notify_tenant_site_changed() RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
	tenant_id_after uuid;
	tenant_id_before uuid;
BEGIN
	IF TG_OP <> 'DELETE' THEN
		tenant_id_after := (to_jsonb(NEW) ->> TG_ARGV[0])::uuid;
		PERFORM pg_notify('tenant_site_changed', 'tenant:' || tenant_id_after);
	END IF;
	IF TG_OP <> 'INSERT' THEN
		tenant_id_before := (to_jsonb(OLD) ->> TG_ARGV[0])::uuid;
		IF tenant_id_before IS DISTINCT FROM tenant_id_after THEN
			PERFORM pg_notify('tenant_site_changed', 'tenant:' || tenant_id_before);
		END IF;
	END IF;
	RETURN NULL;
END;
$$;--> statement-breakpoint

CREATE TRIGGER tenant_sites_notify_tenant_site_changed AFTER INSERT OR UPDATE OR DELETE ON content.tenant_sites
FOR EACH ROW EXECUTE FUNCTION content.notify_tenant_site_changed('tenant_id');--> statement-breakpoint
CREATE TRIGGER articles_notify_tenant_site_changed AFTER INSERT OR UPDATE OR DELETE ON content.articles
FOR EACH ROW EXECUTE FUNCTION content.notify_tenant_site_changed('tenant_id');--> statement-breakpoint
CREATE TRIGGER site_subdomains_notify_tenant_site_changed AFTER INSERT OR UPDATE OR DELETE ON content.site_subdomains
FOR EACH ROW EXECUTE FUNCTION content.notify_tenant_site_changed('tenant_id');--> statement-breakpoint

-- Le Tenant d'une adresse et son adresse actuelle : une seule instruction, qui pose son propre contexte RLS.
CREATE FUNCTION content.find_site_of_subdomain(requested_subdomain text)
RETURNS TABLE (tenant_id uuid, current_subdomain text)
LANGUAGE plpgsql
AS $$
DECLARE
	found_tenant_id uuid;
	found_is_current boolean;
BEGIN
	PERFORM set_config('app.requested_subdomain', requested_subdomain, true);
	SELECT address.tenant_id, address.is_current INTO found_tenant_id, found_is_current
	FROM content.site_subdomains AS address
	WHERE address.subdomain = requested_subdomain;
	IF NOT FOUND THEN
		RETURN;
	END IF;
	IF found_is_current THEN
		RETURN QUERY SELECT found_tenant_id, requested_subdomain;
		RETURN;
	END IF;
	-- Le Tenant vient de la ligne trouvée, jamais de la requête : on peut maintenant lire ses autres adresses.
	PERFORM set_config('app.tenant_id', found_tenant_id::text, true);
	RETURN QUERY
	SELECT found_tenant_id, coalesce(
		(SELECT current_address.subdomain FROM content.site_subdomains AS current_address
			WHERE current_address.tenant_id = found_tenant_id AND current_address.is_current),
		requested_subdomain
	);
END;
$$;--> statement-breakpoint

-- Le contenu du site d'un Tenant (NULL tant qu'il ne l'a pas créé) : une seule instruction, qui pose son propre contexte RLS.
CREATE FUNCTION content.read_tenant_site_content(requested_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
BEGIN
	PERFORM set_config('app.tenant_id', requested_tenant_id::text, true);
	RETURN (
		SELECT jsonb_build_object(
			'layoutId', site.layout_id,
			'layoutSettingsByLayoutId', site.layout_settings,
			'enabledModules', site.enabled_modules,
			'services', site.services,
			'prescriptionIntroduction', site.prescription_introduction,
			'newsSource', site.news_source,
			'articles', coalesce((
				SELECT jsonb_agg(
					jsonb_build_object(
						'title', article.title,
						'summary', article.summary,
						'publishedAt', to_char(article.published_at AT TIME ZONE 'Europe/Paris', 'YYYY-MM-DD')
					) ORDER BY article.published_at DESC
				)
				FROM content.articles AS article
				WHERE article.tenant_id = requested_tenant_id
			), '[]'::jsonb)
		)
		FROM content.tenant_sites AS site
		WHERE site.tenant_id = requested_tenant_id
	);
END;
$$;

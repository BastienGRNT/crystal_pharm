-- Une table que le site affiche prévient `app/site` à chaque changement : la notification
-- ne part qu'au COMMIT, et rien ne part si la transaction est annulée. Le premier argument
-- nomme la colonne du Tenant (vide si la table n'en a pas), le second celle du groupement.
CREATE FUNCTION groups.notify_tenant_site_changed() RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
	row_after jsonb;
	row_before jsonb;
	payload text;
	payloads text[] := '{}';
BEGIN
	IF TG_OP <> 'DELETE' THEN row_after := to_jsonb(NEW); END IF;
	IF TG_OP <> 'INSERT' THEN row_before := to_jsonb(OLD); END IF;
	IF TG_ARGV[0] <> '' THEN
		payloads := payloads || ('tenant:' || (row_after ->> TG_ARGV[0])) || ('tenant:' || (row_before ->> TG_ARGV[0]));
	END IF;
	payloads := payloads || ('group:' || (row_after ->> TG_ARGV[1])) || ('group:' || (row_before ->> TG_ARGV[1]));
	FOR payload IN SELECT DISTINCT changed.payload FROM unnest(payloads) AS changed(payload) WHERE changed.payload IS NOT NULL LOOP
		PERFORM pg_notify('tenant_site_changed', payload);
	END LOOP;
	RETURN NULL;
END;
$$;--> statement-breakpoint

CREATE TRIGGER pharmacy_groups_notify_tenant_site_changed AFTER INSERT OR UPDATE OR DELETE ON groups.pharmacy_groups
FOR EACH ROW EXECUTE FUNCTION groups.notify_tenant_site_changed('', 'id');--> statement-breakpoint
CREATE TRIGGER pharmacy_memberships_notify_tenant_site_changed AFTER INSERT OR UPDATE OR DELETE ON groups.pharmacy_memberships
FOR EACH ROW EXECUTE FUNCTION groups.notify_tenant_site_changed('tenant_id', 'group_id');--> statement-breakpoint
CREATE TRIGGER group_articles_notify_tenant_site_changed AFTER INSERT OR UPDATE OR DELETE ON groups.group_articles
FOR EACH ROW EXECUTE FUNCTION groups.notify_tenant_site_changed('', 'group_id');--> statement-breakpoint

-- Le groupement dont la pharmacie est membre, tel que son site l'affiche (NULL sans groupement) : une seule instruction, qui pose son propre contexte RLS.
CREATE FUNCTION groups.read_group_site_profile_of_tenant(requested_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
BEGIN
	PERFORM set_config('app.tenant_id', requested_tenant_id::text, true);
	RETURN (
		SELECT jsonb_build_object(
			'groupId', pharmacy_group.id,
			'name', pharmacy_group.name,
			'logoId', pharmacy_group.logo_id,
			'loyaltyCardImageId', pharmacy_group.loyalty_card_image_id,
			'loyaltyCardUrl', pharmacy_group.loyalty_card_url,
			'loyaltyCardMessage', pharmacy_group.loyalty_card_message,
			'mandatoryModules', pharmacy_group.mandatory_modules,
			'imposesGroupNews', pharmacy_group.imposes_group_news,
			'articles', coalesce((
				SELECT jsonb_agg(
					jsonb_build_object(
						'articleId', article.id,
						'title', article.title,
						'summary', article.summary,
						'publishedAt', to_char(article.published_at AT TIME ZONE 'Europe/Paris', 'YYYY-MM-DD')
					) ORDER BY article.published_at DESC, article.created_at DESC
				)
				FROM groups.group_articles AS article
				WHERE article.group_id = pharmacy_group.id
			), '[]'::jsonb)
		)
		FROM groups.pharmacy_memberships AS membership
		JOIN groups.pharmacy_groups AS pharmacy_group ON pharmacy_group.id = membership.group_id
		WHERE membership.tenant_id = requested_tenant_id AND membership.left_at IS NULL
	);
END;
$$;

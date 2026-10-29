-- Les droits d'un Tenant décident si son site est servi et jusqu'à quand : tout changement prévient `app/site`.
-- La notification ne part qu'au COMMIT, et rien ne part si la transaction est annulée.
CREATE FUNCTION billing.notify_tenant_site_changed() RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
	tenant_id_after uuid;
	tenant_id_before uuid;
BEGIN
	IF TG_OP <> 'DELETE' THEN
		tenant_id_after := NEW.tenant_id;
		PERFORM pg_notify('tenant_site_changed', 'tenant:' || tenant_id_after);
	END IF;
	IF TG_OP <> 'INSERT' THEN
		tenant_id_before := OLD.tenant_id;
		IF tenant_id_before IS DISTINCT FROM tenant_id_after THEN
			PERFORM pg_notify('tenant_site_changed', 'tenant:' || tenant_id_before);
		END IF;
	END IF;
	RETURN NULL;
END;
$$;--> statement-breakpoint

CREATE TRIGGER tenant_tool_access_notify_tenant_site_changed AFTER INSERT OR UPDATE OR DELETE ON billing.tenant_tool_access
FOR EACH ROW EXECUTE FUNCTION billing.notify_tenant_site_changed();

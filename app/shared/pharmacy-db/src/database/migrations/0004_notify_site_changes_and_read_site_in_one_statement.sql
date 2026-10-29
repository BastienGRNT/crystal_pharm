-- Une table que le site affiche prévient `app/site` à chaque changement : la notification
-- ne part qu'au COMMIT, et rien ne part si la transaction est annulée.
CREATE FUNCTION pharmacy.notify_tenant_site_changed() RETURNS trigger
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

CREATE TRIGGER tenants_notify_tenant_site_changed AFTER INSERT OR UPDATE OR DELETE ON pharmacy.tenants
FOR EACH ROW EXECUTE FUNCTION pharmacy.notify_tenant_site_changed('id');--> statement-breakpoint
CREATE TRIGGER employees_notify_tenant_site_changed AFTER INSERT OR UPDATE OR DELETE ON pharmacy.employees
FOR EACH ROW EXECUTE FUNCTION pharmacy.notify_tenant_site_changed('tenant_id');--> statement-breakpoint

-- La fiche de la pharmacie telle que son site l'affiche (NULL si le Tenant n'existe pas) : une seule instruction, qui pose son propre contexte RLS.
CREATE FUNCTION pharmacy.read_pharmacy_profile_for_site(requested_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
BEGIN
	PERFORM set_config('app.tenant_id', requested_tenant_id::text, true);
	RETURN (
		SELECT jsonb_build_object(
			'name', tenant.name,
			'street', tenant.street,
			'postalCode', tenant.postal_code,
			'city', tenant.city,
			'phoneNumber', tenant.phone_number,
			'email', tenant.email,
			'weeklyOpeningSchedule', tenant.weekly_opening_schedule
		)
		FROM pharmacy.tenants AS tenant
		WHERE tenant.id = requested_tenant_id
	);
END;
$$;--> statement-breakpoint

-- L'équipe, dans l'ordre où ses membres ont été ajoutés : une seule instruction, qui pose son propre contexte RLS.
CREATE FUNCTION pharmacy.read_employees_for_site(requested_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
BEGIN
	PERFORM set_config('app.tenant_id', requested_tenant_id::text, true);
	RETURN coalesce((
		SELECT jsonb_agg(
			jsonb_build_object(
				'employeeId', employee.id,
				'firstName', employee.first_name,
				'lastName', employee.last_name,
				'jobTitle', employee.job_title,
				'photoId', employee.photo_id
			) ORDER BY employee.created_at
		)
		FROM pharmacy.employees AS employee
		WHERE employee.tenant_id = requested_tenant_id
	), '[]'::jsonb);
END;
$$;

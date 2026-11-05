-- Chaque titulaire rejoint l'équipe de sa pharmacie, avec le poste « Titulaire » qu'il pourra changer.
-- Les comptes sans prénom ni nom (d'avant les règles de noms) restent hors équipe : une fiche vide casserait l'équipe.
WITH owners_without_employee AS (
	SELECT
		memberships.tenant_id,
		memberships.account_id,
		gen_random_uuid() AS employee_id,
		accounts.first_name,
		accounts.last_name
	FROM "pharmacy"."tenant_memberships" AS memberships
	INNER JOIN "auth"."users" AS accounts ON accounts.id = memberships.account_id
	WHERE memberships.member_kind = 'owner'
		AND memberships.employee_id IS NULL
		AND accounts.first_name <> ''
		AND accounts.last_name <> ''
), created_employees AS (
	INSERT INTO "pharmacy"."employees" ("id", "tenant_id", "first_name", "last_name", "job_title")
	SELECT employee_id, tenant_id, first_name, last_name, 'Titulaire' FROM owners_without_employee
)
UPDATE "pharmacy"."tenant_memberships" AS memberships
SET "employee_id" = owners_without_employee.employee_id
FROM owners_without_employee
WHERE memberships.tenant_id = owners_without_employee.tenant_id
	AND memberships.account_id = owners_without_employee.account_id;

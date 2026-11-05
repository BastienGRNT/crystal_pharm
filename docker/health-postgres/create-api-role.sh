#!/bin/sh
# Le stand-in du Postgres HDS managé, au premier démarrage : le rôle ordinaire de l'API C# (soumis à la
# Row-Level Security), et ses droits sur les tables que le propriétaire créera en migrant.
# Chez l'hébergeur HDS, le même SQL se lance une fois, par le rôle propriétaire (cf. docs/architecture.md).
set -eu

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
	-v owner="$POSTGRES_USER" -v api_role="$HEALTH_API_ROLE" -v api_password="$HEALTH_API_PASSWORD" <<'SQL'
create role :"api_role" login password :'api_password' nosuperuser nobypassrls;
create schema if not exists booking authorization :"owner";
create schema if not exists prescriptions authorization :"owner";
grant usage on schema booking, prescriptions to :"api_role";
alter default privileges for role :"owner" in schema booking, prescriptions
	grant select, insert, update, delete on tables to :"api_role";
alter default privileges for role :"owner" in schema booking, prescriptions
	grant usage, select on sequences to :"api_role";
SQL

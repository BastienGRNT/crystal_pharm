start:
	docker compose up -d
	until docker compose exec -T postgres pg_isready -U $$(grep -oP '(?<=^POSTGRES_USER=).*' .env) > /dev/null 2>&1; do sleep 1; done

logs:
	docker compose logs -f

migrate:
	cd app && pnpm --recursive migrate

api:
	cd app/api/CrystalPharm.Api && dotnet watch run

# Le contrat du C# (OpenAPI, écrit au build sans lancer l'API) devient les types de
# shared/api-client. Les valeurs factices ne servent qu'à construire l'hôte, jamais à se connecter.
gen-types:
	cd app/api && ConnectionStrings__Booking=Host=unused ManagerJwt__JwksUrl=http://unused ManagerJwt__Issuer=unused ManagerJwt__Audience=unused \
		dotnet build CrystalPharm.Api -p:OpenApiGenerateDocuments=true
	cd app && pnpm --filter @crystal-pharm/api-client generate

.PHONY: start logs migrate api gen-types

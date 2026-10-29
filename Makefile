start:
	docker compose up -d
	until docker compose exec -T postgres pg_isready -U $$(sed -n 's/^POSTGRES_USER=//p' .env) > /dev/null 2>&1; do sleep 1; done

# Tout d'une commande : Postgres et Caddy, les dépendances, les migrations, puis l'API C#
# et les apps dans ce terminal (Ctrl+C arrête tout). Un serveur resté d'une session
# précédente garderait son port avec son ancien code : on le libère d'abord.
development_server_ports = 5158 5173 5174 5175 5177

dev: start
	cd app && pnpm install
	$(MAKE) migrate
	-fuser --kill $(addsuffix /tcp,$(development_server_ports)) > /dev/null 2>&1
	trap 'kill 0' INT TERM; \
	(cd app/api/CrystalPharm.Api && dotnet watch run --non-interactive) & \
	(cd app && pnpm dev) & \
	wait

logs:
	docker compose logs -f

migrate:
	cd app && pnpm --recursive migrate
	cd app && pnpm --filter @crystal-pharm/billing-db rebuild-tool-access

api:
	cd app/api/CrystalPharm.Api && dotnet watch run

# Le contrat du C# (OpenAPI, écrit au build sans lancer l'API) devient les types de
# shared/api-client. Les valeurs factices ne servent qu'à construire l'hôte, jamais à se connecter.
gen-types:
	cd app/api && ConnectionStrings__Booking=Host=unused ConnectionStrings__Prescriptions=Host=unused PrescriptionStorage__LocalDirectory=unused SiteService__ApiKey=unused-unused-unused-unused-unused ManagerJwt__JwksUrl=http://unused ManagerJwt__Issuer=unused ManagerJwt__Audience=unused \
		dotnet build CrystalPharm.Api -p:OpenApiGenerateDocuments=true
	cd app && pnpm --filter @crystal-pharm/api-client generate

.PHONY: start dev logs migrate api gen-types

start:
	docker compose up -d --wait

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
	cd app/api && ConnectionStrings__Booking=Host=unused ConnectionStrings__Prescriptions=Host=unused PrescriptionStorage__ServiceUrl=http://unused PrescriptionStorage__BucketName=unused PrescriptionStorage__AccessKeyId=unused PrescriptionStorage__SecretAccessKey=unused SiteService__ApiKey=unused-unused-unused-unused-unused ManagerJwt__JwksUrl=http://unused ManagerJwt__Issuer=unused ManagerJwt__Audience=unused \
		dotnet build CrystalPharm.Api -p:OpenApiGenerateDocuments=true
	cd app && pnpm --filter @crystal-pharm/api-client generate

# La prod simulée : docker-compose.prod.yml, ses fournisseurs remplacés par des conteneurs et chaque
# serveur borné à sa taille (docker/simulation/). Pharmacie : http://pharmacie.localhost:8090,
# emails : http://localhost:8026.
simulation_compose = docker compose -p crystal-pharm-simulation \
	--env-file env/simulation/providers.env --env-file env/simulation/database.env \
	--env-file env/simulation/web.env --env-file env/simulation/api.env \
	-f docker-compose.prod.yml -f docker/simulation/compose.yml

simulate:
	$(simulation_compose) up -d --build

simulate-stop:
	$(simulation_compose) down

.PHONY: start dev logs migrate api gen-types simulate simulate-stop

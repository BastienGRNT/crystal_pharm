start:
	docker compose up -d
	until docker compose exec -T postgres pg_isready -U $$(grep -oP '(?<=^POSTGRES_USER=).*' .env) > /dev/null 2>&1; do sleep 1; done

logs:
	docker compose logs -f

migrate:
	cd app && pnpm --recursive migrate

api:
	cd app/api/CrystalPharm.Api && dotnet watch run

.PHONY: start logs migrate api

start:
	docker compose up -d
	# TODO: lancer l'app SvelteKit une fois qu'elle existe
	until docker compose exec -T postgres pg_isready -U $$(grep -oP '(?<=^POSTGRES_USER=).*' .env) > /dev/null 2>&1; do sleep 1; done

logs:
	docker compose logs -f

api:
	cd app/api/CrystalPharm.Api && dotnet watch run

dev-layout:
	cd app && pnpm --filter @crystal-pharm/layouts dev

check-layout:
	cd app && pnpm --filter @crystal-pharm/layouts check:watch

.PHONY: start logs api dev-layout check-layout

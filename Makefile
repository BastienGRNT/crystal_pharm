start:
	docker compose up -d
	# TODO: lancer l'API C# et l'app SvelteKit une fois qu'ils existent
	until docker compose exec -T postgres pg_isready -U $$(grep -oP '(?<=^POSTGRES_USER=).*' .env) > /dev/null 2>&1; do sleep 1; done

logs:
	docker compose logs -f

.PHONY: start logs

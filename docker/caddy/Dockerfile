# Caddy avec le cache HTTP (Souin) et son stockage en mémoire : les pages des sites
# publics ne sont rendues qu'une fois par version du site. Versions épinglées.
FROM caddy:2.11.7-builder AS builder
RUN xcaddy build v2.11.7 \
	--with github.com/caddyserver/cache-handler@v0.17.0 \
	--with github.com/darkweak/storages/otter/caddy@v0.0.20

FROM caddy:2.11.7
COPY --from=builder /usr/bin/caddy /usr/bin/caddy

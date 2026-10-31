#!/bin/sh
# Caddy veut des noms d'hôte seuls ; les variables du déploiement sont des URLs (https://domaine).
set -eu

extract_host() {
	without_scheme="${1#*://}"
	echo "${without_scheme%%/*}"
}

export PHARMACY_HOST="$(extract_host "$PHARMACY_URL")"
export GROUP_HOST="$(extract_host "$GROUP_URL")"
export ADMIN_HOST="$(extract_host "$ADMIN_URL")"
export SITE_HOST="$(extract_host "$SITE_URL")"
export SITE_PREVIEW_HOST="$(extract_host "$SITE_PREVIEW_URL")"

exec caddy run --config /etc/caddy/Caddyfile

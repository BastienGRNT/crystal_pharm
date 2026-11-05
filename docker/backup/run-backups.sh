#!/bin/bash
# Toutes les BACKUP_INTERVAL_HOURS heures : un dump de la base du Node et une copie des fichiers, chiffrés
# avec BACKUP_ENCRYPTION_PASSWORD (perdu = sauvegardes illisibles), sous BACKUP_PREFIX dans le bucket des
# sauvegardes ; après un échec, nouvel essai BACKUP_RETRY_MINUTES minutes plus tard. Les dumps et les fichiers remplacés de plus de BACKUP_RETENTION_DAYS jours sont effacés.
# Restaurer : docs/architecture.md, « Sauvegardes ».
set -euo pipefail

export RCLONE_CONFIG_FILES_TYPE=s3
export RCLONE_CONFIG_FILES_PROVIDER=Other
export RCLONE_CONFIG_FILES_ENDPOINT="$FILE_STORAGE_ENDPOINT"
export RCLONE_CONFIG_FILES_REGION="$FILE_STORAGE_REGION"
export RCLONE_CONFIG_FILES_ACCESS_KEY_ID="$BACKUP_FILES_ACCESS_KEY_ID"
export RCLONE_CONFIG_FILES_SECRET_ACCESS_KEY="$BACKUP_FILES_SECRET_ACCESS_KEY"
export RCLONE_CONFIG_FILES_FORCE_PATH_STYLE=true

export RCLONE_CONFIG_BACKUPS_TYPE=s3
export RCLONE_CONFIG_BACKUPS_PROVIDER=Other
export RCLONE_CONFIG_BACKUPS_ENDPOINT="$BACKUP_STORAGE_ENDPOINT"
export RCLONE_CONFIG_BACKUPS_REGION="$BACKUP_STORAGE_REGION"
export RCLONE_CONFIG_BACKUPS_ACCESS_KEY_ID="$BACKUP_STORAGE_ACCESS_KEY_ID"
export RCLONE_CONFIG_BACKUPS_SECRET_ACCESS_KEY="$BACKUP_STORAGE_SECRET_ACCESS_KEY"
export RCLONE_CONFIG_BACKUPS_FORCE_PATH_STYLE=true
export RCLONE_CONFIG_BACKUPS_NO_CHECK_BUCKET=true

export RCLONE_CONFIG_ENCRYPTED_TYPE=crypt
export RCLONE_CONFIG_ENCRYPTED_REMOTE="backups:$BACKUP_STORAGE_BUCKET/$BACKUP_PREFIX"
RCLONE_CONFIG_ENCRYPTED_PASSWORD="$(rclone obscure "$BACKUP_ENCRYPTION_PASSWORD")"
export RCLONE_CONFIG_ENCRYPTED_PASSWORD

back_up_database() {
	pg_dump --format=custom --no-owner --dbname="$DATABASE_URL" \
		| rclone rcat "encrypted:database/$1.dump"
}

back_up_files() {
	rclone sync "files:$FILE_STORAGE_BUCKET" "encrypted:files/current" \
		--backup-dir "encrypted:files/replaced/$1"
}

forget_old_backups() {
	rclone delete "encrypted:database" --min-age "${BACKUP_RETENTION_DAYS}d" \
		&& rclone delete "encrypted:files/replaced" --min-age "${BACKUP_RETENTION_DAYS}d" --rmdirs
}

while true; do
	started_at="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
	if back_up_database "$started_at" && back_up_files "$started_at" && forget_old_backups; then
		echo "Sauvegarde $started_at terminée."
		sleep "$((BACKUP_INTERVAL_HOURS * 3600))"
	else
		echo "Sauvegarde $started_at en échec : nouvel essai dans ${BACKUP_RETRY_MINUTES:-10} minutes." >&2
		sleep "$((${BACKUP_RETRY_MINUTES:-10} * 60))"
	fi
done

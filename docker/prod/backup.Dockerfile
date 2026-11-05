# Les sauvegardes de la partie hors HDS : pg_dump du Postgres du Node et copie du stockage objet des fichiers,
# chiffrés par rclone (crypt) avant de partir vers le stockage des sauvegardes. Le contexte est la racine du dépôt.
FROM postgres:16@sha256:1beaa3084eee2676f20a9cd9928f0bf2c5bf674f8e49f81017912183d377c61c
RUN apt-get update \
	&& apt-get install --yes --no-install-recommends rclone ca-certificates \
	&& rm -rf /var/lib/apt/lists/*
COPY docker/backup/run-backups.sh /usr/local/bin/run-backups.sh
USER postgres
ENTRYPOINT ["/usr/local/bin/run-backups.sh"]

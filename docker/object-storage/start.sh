#!/bin/sh
# Le stand-in d'un stockage objet S3 (SeaweedFS) : démarre le serveur, puis crée les buckets de
# OBJECT_STORAGE_BUCKETS (séparés par des espaces) une fois qu'il répond. Un bucket existant est gardé.
set -eu

weed server -dir=/data -ip.bind=0.0.0.0 -s3 -s3.config=/etc/seaweedfs/s3.json -s3.port=8333 \
	-volume.max=0 -master.volumeSizeLimitMB=64 &
server_process=$!

for bucket in ${OBJECT_STORAGE_BUCKETS:-}; do
	until echo "s3.bucket.list" | weed shell -master=localhost:9333 2>/dev/null | grep -qE "^  $bucket\b|created bucket $bucket" \
		|| echo "s3.bucket.create -name $bucket" | weed shell -master=localhost:9333 2>/dev/null | grep -qE "created bucket $bucket|already exist"; do
		sleep 1
	done
	echo "bucket $bucket prêt"
done

wait "$server_process"

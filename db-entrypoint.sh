#! /bin/sh

export POSTGRES_DB="$OC_DATABASE_NAME"
export POSTGRES_USER="$OC_DATABASE_USERNAME"
export POSTGRES_PASSWORD="$OC_DATABASE_PASSWORD"

exec docker-entrypoint.sh postgres

#!/bin/sh
set -e

HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-3000}"
WORKERS="${WEB_CONCURRENCY:-2}"

echo "Starting Steam Username Checker on ${HOST}:${PORT}"

exec gunicorn \
  --bind "${HOST}:${PORT}" \
  --workers "${WORKERS}" \
  --timeout 120 \
  --access-logfile - \
  --error-logfile - \
  --forwarded-allow-ips='*' \
  app:app

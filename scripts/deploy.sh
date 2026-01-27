#!/usr/bin/env bash
set -euo pipefail

APP_NAME="study_repository"
IMAGE="${1:?usage: deploy.sh <image>}"
ENV_FILE="/srv/www/study_repository/.env"
HEALTH_PATH="/api/health"
BLUE_PORT=3001
GREEN_PORT=3002
NGINX_CONF="/etc/nginx/sites-enabled/study_repository.conf"

CURRENT_PORT=$(awk -F: '/proxy_pass http:\/\/127.0.0.1:/ {print $3}' "$NGINX_CONF" | tr -d ';' || true)
if [[ -z "${CURRENT_PORT}" ]]; then
  CURRENT_PORT=$BLUE_PORT
fi

if [[ "$CURRENT_PORT" == "$BLUE_PORT" ]]; then
  NEW_PORT=$GREEN_PORT
  NEW_COLOR="green"
  OLD_COLOR="blue"
else
  NEW_PORT=$BLUE_PORT
  NEW_COLOR="blue"
  OLD_COLOR="green"
fi

echo "Current: $CURRENT_PORT, Deploying: $NEW_COLOR -> $NEW_PORT"

docker pull "$IMAGE"

docker rm -f "${APP_NAME}_${NEW_COLOR}" >/dev/null 2>&1 || true
docker run -d --name "${APP_NAME}_${NEW_COLOR}" \
  --env-file "$ENV_FILE" \
  -p "127.0.0.1:${NEW_PORT}:3000" \
  --restart unless-stopped \
  "$IMAGE"

for i in {1..20}; do
  if curl -fsS "http://127.0.0.1:${NEW_PORT}${HEALTH_PATH}" >/dev/null; then
    echo "Health check OK"
    break
  fi
  echo "Waiting for health check... ($i)"
  sleep 2
  if [[ $i -eq 20 ]]; then
    echo "Health check failed"
    docker logs "${APP_NAME}_${NEW_COLOR}" || true
    docker rm -f "${APP_NAME}_${NEW_COLOR}" || true
    exit 1
  fi
done

docker exec "${APP_NAME}_${NEW_COLOR}" pnpm drizzle:push

sudo sed -i.bak "s/127.0.0.1:${CURRENT_PORT}/127.0.0.1:${NEW_PORT}/" "$NGINX_CONF"
sudo nginx -t && sudo systemctl reload nginx

sleep 20
docker rm -f "${APP_NAME}_${OLD_COLOR}" >/dev/null 2>&1 || true

echo "Deploy done: ${NEW_COLOR} is live on ${NEW_PORT}"

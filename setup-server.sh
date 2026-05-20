#!/bin/bash
# Запускать на сервере: bash setup-server.sh
set -e

echo "=== 1. Устанавливаем Docker ==="
apt-get update -y
curl -fsSL https://get.docker.com | sh
echo "Docker установлен: $(docker --version)"

echo ""
echo "=== 2. Создаём папку проекта ==="
mkdir -p /srv/tours
cd /srv/tours

echo ""
echo "=== 3. Создаём docker-compose.prod.yml ==="
cat > /srv/tours/docker-compose.prod.yml << 'COMPOSE_EOF'
# Production docker-compose for the VPS server.
# Run migrations after each API deploy:
#   docker compose -f docker-compose.prod.yml exec api \
#     npx prisma migrate deploy --schema=packages/db/prisma/schema.prisma

services:
  postgres:
    image: postgres:16-alpine
    container_name: tours-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: tours
    volumes:
      - tours_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d tours"]
      interval: 5s
      timeout: 5s
      retries: 5

  api:
    image: ${DOCKERHUB_USERNAME}/${DOCKERHUB_IMAGE_API}:latest
    container_name: tours-api
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "4000:4000"
    environment:
      NODE_ENV: production
      PORT: 4000
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/tours?schema=public
      WEB_ORIGIN: ${WEB_ORIGIN}
      COOKIE_DOMAIN: ${COOKIE_DOMAIN}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-15m}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      JWT_REFRESH_EXPIRES_IN: ${JWT_REFRESH_EXPIRES_IN:-7d}
      APP_URL: ${APP_URL}
      MAIL_HOST: ${MAIL_HOST}
      MAIL_PORT: ${MAIL_PORT:-587}
      MAIL_SECURE: ${MAIL_SECURE:-false}
      MAIL_USER: ${MAIL_USER}
      MAIL_PASS: ${MAIL_PASS}
      MAIL_FROM: ${MAIL_FROM}
      ADMIN_NOTIFY_EMAIL: ${ADMIN_NOTIFY_EMAIL}
      BLOB_READ_WRITE_TOKEN: ${BLOB_READ_WRITE_TOKEN:-}
      PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: "true"
      PUPPETEER_EXECUTABLE_PATH: /usr/bin/chromium-browser

  web:
    image: ${DOCKERHUB_USERNAME}/${DOCKERHUB_IMAGE_WEB}:latest
    container_name: tours-web
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      PORT: 3000

volumes:
  tours_postgres_data:
    name: tours_postgres_data
COMPOSE_EOF

echo ""
echo "=== 4. Создаём .env ==="
cat > /srv/tours/.env << 'ENV_EOF'
DOCKERHUB_USERNAME=REPLACE_YOUR_DOCKERHUB_USERNAME
DOCKERHUB_IMAGE_API=tours-api
DOCKERHUB_IMAGE_WEB=tours-web

POSTGRES_USER=tours
POSTGRES_PASSWORD=Tours2024Prod!Secure

WEB_ORIGIN=http://93.115.22.45:3000
COOKIE_DOMAIN=93.115.22.45

JWT_SECRET=tLUn3UVkQYOONimWL6ffnn19SANZ8ORXuSPFTpB3KcEhCUwQdHNE9uv70GaniATT
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=vYq6zl+utwyzFuyvjVjNPtxhozVey5PQX2hDtehmmWB9BL2+VFfhp0nFhgbKLUkv
JWT_REFRESH_EXPIRES_IN=7d

APP_URL=http://93.115.22.45:3000

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=vibeclubtech@gmail.com
MAIL_PASS=ghtp bksqkztugygk
MAIL_FROM=Tours Travel <vibeclubtech@gmail.com>
ADMIN_NOTIFY_EMAIL=vibeclubtech@gmail.com

BLOB_READ_WRITE_TOKEN=
ENV_EOF

chmod 600 /srv/tours/.env
echo ".env создан"

echo ""
echo "=== 5. Создаём SSH ключ для GitHub Actions ==="
ssh-keygen -t ed25519 -C "github-actions-tours" -f /root/.ssh/github_actions -N ""
cat /root/.ssh/github_actions.pub >> /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys

echo ""
echo "================================================================"
echo "ГОТОВО! Скопируй этот приватный ключ в GitHub Secret VPS_SSH_KEY:"
echo "================================================================"
cat /root/.ssh/github_actions
echo "================================================================"
echo ""
echo "Следующий шаг — добавь в GitHub Secrets:"
echo "  VPS_SSH_KEY  = (ключ выше)"
echo "  SERVER_IPADDRESS = 93.115.22.45"
echo "  SERVER_USERNAME  = root"
echo "  SERVER_PROJECT_FOLDER = /srv/tours"
echo ""
echo "После первого деплоя выполни миграции:"
echo "  cd /srv/tours"
echo "  docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy --schema=packages/db/prisma/schema.prisma"

# DEPLOY.md — Гайд по деплою Tours

> Этот документ — пошаговая инструкция как поднять Tours в production.
> Контекст проекта: `CLAUDE.md`. Прогресс по дням: `PLAN.md`.

---

## Обзор архитектуры production

```
┌──────────────────────┐         ┌──────────────────────┐         ┌─────────────────────┐
│  Vercel              │ ───────▶│  Render / Railway    │ ───────▶│  Neon Postgres /    │
│  (Next.js 16 web)    │  CORS   │  (NestJS 11 api)     │ Prisma  │  локальный Docker   │
│  tours.example.com   │         │  api.tours.example   │         │  serverless         │
└──────────────────────┘         └──────────────────────┘         └─────────────────────┘
        │                                  │
        ├─── Resend (email)               │
        └─── Vercel Blob (фото — Day 7+) ──┘
```

**Текущий рабочий setup на твоей машине:**
- БД — Docker Postgres (локально, в `docker-compose.yml`)
- API — `npm run dev` на `localhost:4000`
- Web — `npm run dev` на `localhost:3000`

Для production есть 3 варианта по БД:
1. **Оставить локальный Postgres** (если деплой на свой VPS, где Docker уже стоит) — этот сценарий описан в Варианте A
2. **Neon Postgres** (serverless, бесплатный tier 0.5 GB) — Вариант B
3. **Render Postgres** (внутри платформы Render) — Вариант C

---

## Вариант A: Свой VPS + Docker (для контроля)

### A1. Подготовь сервер (Ubuntu 22.04 LTS, минимум 1 GB RAM)

```bash
# Установить Docker + Node + nginx
curl -fsSL https://get.docker.com | sh
sudo systemctl enable --now docker
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx git
```

### A2. Клонировать репозиторий и установить зависимости

```bash
git clone <your-repo-url> /var/www/tours
cd /var/www/tours
npm install
```

### A3. Поднять Postgres

```bash
docker compose up -d
```

### A4. Создать `.env.local` для API в `apps/api/`

```env
NODE_ENV=production
DATABASE_URL=postgresql://tours:tours_dev_password@localhost:5432/tours?schema=public
PORT=4000
WEB_ORIGIN=https://tours.example.com
COOKIE_DOMAIN=.tours.example.com
JWT_SECRET=<64-символьная-случайная-строка>
JWT_REFRESH_SECRET=<другая-64-символьная>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
APP_URL=https://tours.example.com
RESEND_API_KEY=<твой-resend-ключ>
EMAIL_FROM="Tours <noreply@tours.example.com>"
```

### A5. Применить миграции и засеять

```bash
cd packages/db
cp .env.example .env
# отредактируй DATABASE_URL в .env
npx prisma migrate deploy
npx prisma db seed   # опционально, для теста
cd ../..
```

### A6. Собрать оба приложения

```bash
npm run build
```

### A7. Запустить через PM2

```bash
sudo npm install -g pm2
pm2 start apps/api/dist/main.js --name tours-api
pm2 start --name tours-web npm -- run start --prefix apps/web
pm2 save && pm2 startup
```

### A8. Настроить nginx (reverse proxy)

`/etc/nginx/sites-available/tours`:
```nginx
server {
  listen 80;
  server_name tours.example.com;
  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
server {
  listen 80;
  server_name api.tours.example.com;
  location / {
    proxy_pass http://localhost:4000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

Активировать:
```bash
sudo ln -s /etc/nginx/sites-available/tours /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### A9. HTTPS через Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tours.example.com -d api.tours.example.com
```

---

## Вариант B: Vercel (web) + Render (api) + Neon (DB) — **рекомендую для старта**

Без сервера, всё managed. Бесплатные tier'ы достаточны для MVP.

### B1. Neon Postgres

1. Зарегистрируйся на **https://console.neon.tech**
2. Создай проект `tours`
3. На дашборде скопируй **Connection String** вида:
   `postgresql://user:pass@ep-xxx.neon.tech/tours?sslmode=require`
4. Локально применить миграции и заслать seed:
   ```bash
   # в packages/db/.env временно подставь Neon DATABASE_URL
   npx prisma migrate deploy
   npx prisma db seed
   ```

### B2. Render для API

1. Регистрируйся на **https://render.com**
2. New → **Web Service** → подключи свой GitHub репозиторий
3. Настройки:
   - **Root Directory:** `apps/api`
   - **Build Command:**
     ```
     cd ../.. && npm install && cd packages/db && npx prisma generate && cd ../../apps/api && npx nest build
     ```
   - **Start Command:** `node dist/main.js`
   - **Environment Variables** (см. секцию ниже)
4. Дождись успешного билда. URL: `https://tours-api.onrender.com`

> ⚠️ Бесплатный план Render «засыпает» через 15 мин неактивности. Первый запрос после простоя — 30-60 сек. Для продакшна — платный план $7/мес.

### B3. Vercel для Web

1. Регистрируйся на **https://vercel.com**
2. New Project → подключи репозиторий
3. Настройки:
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/web`
   - **Build Command:** `cd ../.. && npm install && cd apps/web && npm run build`
   - **Environment Variables:**
     - `NEXT_PUBLIC_API_URL=https://tours-api.onrender.com/api/v1`
     - `NEXT_PUBLIC_APP_URL=https://tours.vercel.app`
4. Deploy. URL: `https://tours.vercel.app`

### B4. Связать через CORS

После деплоя на Render — обнови переменную **`WEB_ORIGIN`** на URL Vercel:
```
WEB_ORIGIN=https://tours.vercel.app
```

И **`COOKIE_DOMAIN`** на:
```
COOKIE_DOMAIN=.onrender.com    # для cross-domain cookies (если api и web на разных доменах)
```

> 💡 Идеально — иметь один корневой домен `tours.example.com` для web и `api.tours.example.com` для api, тогда `COOKIE_DOMAIN=.tours.example.com` работает для обоих.

---

## Вариант C: Railway (одна платформа для всего)

1. Регистрируйся на **https://railway.app**
2. New Project → Deploy from GitHub
3. Railway сам создаст 2 сервиса (web и api) и Postgres
4. Установи env-переменные через UI (см. ниже)

Railway даёт $5 кредитов/мес бесплатно, дальше платно.

---

## Чеклист переменных окружения (production)

### apps/api (на Render/Railway/VPS)

| Variable | Пример | Обязательно? |
|---|---|---|
| `NODE_ENV` | `production` | ✅ |
| `DATABASE_URL` | `postgresql://...?sslmode=require` | ✅ |
| `PORT` | `4000` (Render задаёт сам через `process.env.PORT`) | ✅ |
| `WEB_ORIGIN` | `https://tours.vercel.app` | ✅ |
| `COOKIE_DOMAIN` | `.tours.example.com` или `.onrender.com` | ✅ |
| `JWT_SECRET` | 64+ случайных символов | ✅ |
| `JWT_REFRESH_SECRET` | другие 64+ символов | ✅ |
| `JWT_EXPIRES_IN` | `15m` | (опционально) |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | (опционально) |
| `APP_URL` | `https://tours.vercel.app` | ✅ (для ссылок в email) |
| `RESEND_API_KEY` | `re_...` (с https://resend.com/api-keys) | для писем |
| `EMAIL_FROM` | `Tours <noreply@yourdomain.com>` | для писем |
| `BLOB_READ_WRITE_TOKEN` | (если есть Vercel Blob) | для фото |

### apps/web (на Vercel)

| Variable | Пример |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://tours-api.onrender.com/api/v1` |
| `NEXT_PUBLIC_APP_URL` | `https://tours.vercel.app` |

---

## Чеклист после деплоя

- [ ] Открой `https://api.tours.example.com/api/v1/health` — должен вернуть `{"status":"ok","db":"ok"}`
- [ ] Открой `https://api.tours.example.com/api/v1/docs` — Swagger UI должен показать все эндпоинты
- [ ] Открой `https://tours.example.com/ru` — главная с турами
- [ ] Зарегистрируйся новым пользователем — пришло ли welcome email (проверь логи API на наличие `Email sent to ...: <resend-id>`)
- [ ] Создай тестовую заявку → залогинься как admin → переведи в PAID — у тебя должна расти `referralCount` (если ты CLIENT) или `balance` (если PARTNER) у реферера
- [ ] Прогон сценариев из ТЗ:
   1. **Покупка тура:** гость → каталог → страница тура → заявка → email подтверждения
   2. **Реф-активность:** копирование реф-ссылки → инкогнито → клик → регистрация → заявка → админ ставит PAID → +1 счётчик / +5% баланс
   3. **UGC:** клиент с PAID-заявкой → `/dashboard/reviews/new` → отзыв → админ одобряет → виден на странице тура

---

## Backup БД (production)

### Neon
Автоматические бэкапы каждые 24 часа, восстановление через UI.

### Свой Postgres
```bash
# Дамп
docker compose exec postgres pg_dump -U tours tours > backup_$(date +%F).sql

# Восстановление
docker compose exec -T postgres psql -U tours tours < backup_2026-05-17.sql
```

---

## Мониторинг

- **Render/Railway** — встроенный мониторинг и логи в UI
- **VPS** — `pm2 logs tours-api` / `pm2 monit`

## Грабли (учитывай при деплое)

1. **Native binaries (bcrypt, prisma engine)** — пересоберутся автоматически при `npm install` на Linux-сервере. Не копируй `node_modules` с Windows!
2. **Prisma engine** — `npx prisma generate` нужно запустить **после** `npm install` в build-команде.
3. **Cross-domain cookies** — без правильного `COOKIE_DOMAIN` и `SameSite=None; Secure` cookies не пройдут между разными доменами. Проще держать всё на одном домене (`tours.com` для web и `tours.com/api/...` proxy на api).
4. **CORS WEB_ORIGIN** — должен включать **только** реальные origins, без trailing slash. Можно несколько через запятую.
5. **Resend домен** — отправка с `onboarding@resend.dev` работает только в sandbox. Для prod нужно подтвердить свой домен через DKIM/SPF.

# ENV_SECRETS — Приватные переменные окружения

> ⚠️ Этот файл содержит реальные секреты для локальной разработки.
> В продакшне все значения должны быть заменены на надёжные случайные строки.
> Сами `.env` файлы не хранятся в репозитории (исключены через `.gitignore`).

---

## `apps/api/.env`

```env
DATABASE_URL="postgresql://tours:tours_dev_password@localhost:5432/tours?schema=public"

PORT=4000

WEB_ORIGIN=http://localhost:3000

COOKIE_DOMAIN=localhost

JWT_SECRET="dev_jwt_secret_change_in_production_64chars_minimum_here"
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET="dev_jwt_refresh_secret_change_in_production_here"
JWT_REFRESH_EXPIRES_IN=7d

APP_URL=http://localhost:3000

RESEND_API_KEY=
BLOB_READ_WRITE_TOKEN=
```

---

## `apps/web/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## `packages/db/.env`

```env
DATABASE_URL="postgresql://tours:tours_dev_password@localhost:5432/tours?schema=public"
```

---

## Как воссоздать `.env` файлы на новой машине

```bash
# apps/api/.env
cp apps/api/.env.example apps/api/.env
# Заполни значения из секции выше

# apps/web/.env.local
echo 'NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1' > apps/web/.env.local
echo 'NEXT_PUBLIC_APP_URL=http://localhost:3000' >> apps/web/.env.local

# packages/db/.env
echo 'DATABASE_URL="postgresql://tours:tours_dev_password@localhost:5432/tours?schema=public"' > packages/db/.env
```

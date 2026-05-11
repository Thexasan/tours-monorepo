# CLAUDE.md — Контекст проекта Tours

> 📍 **Этот файл — единый источник правды для любого Claude-чата, работающего с проектом.**
> Читать первым. Обновлять после каждой значимой смены архитектуры.
> Полное ТЗ — `Traveling tour system.pdf` в корне. План работ и прогресс — `PLAN.md`.

---

## 1. Что это за проект

**Tours** — туристическая реферальная веб-платформа для бронирования туров с двумя реферальными движками. **Документация API: см. Swagger UI на http://localhost:4000/api/v1/docs (live OpenAPI).** Деплой: см. `DEPLOY.md`.

- **B2C-движок (клиент):** клиент приглашает 50 друзей по реф-ссылке → получает бесплатный тур.
- **B2B-движок (партнёр):** партнёр (блогер/агент) получает 5% с каждой оплаченной по его ссылке продажи.

Заявки обрабатывает менеджер вручную. **Онлайн-эквайринга нет.** Начисление вознаграждений триггерится сменой статуса заявки на `PAID` в админке.

## 2. Роли пользователей

| Роль | Возможности |
|---|---|
| `GUEST` | Просмотр туров, поиск, регистрация |
| `CLIENT` | Бронирование, личный кабинет, UGC, реф-ссылка, прогресс к бесплатному туру |
| `PARTNER` | Дашборд статистики, баланс 5%, запрос вывода средств |
| `ADMIN` | Управление турами, заявками, модерация, выплаты партнёрам |

## 3. Стек

### Фронтенд (`apps/web`)
- **Next.js 16.2** (App Router, React 19) — **ВНИМАНИЕ:** breaking changes от знаний модели, см. `apps/web/AGENTS.md`. Перед написанием Next.js-кода читать локальные доки в `node_modules/next/dist/docs/`.
- **TypeScript** strict, `noUncheckedIndexedAccess`
- **Tailwind CSS 4** + **shadcn/ui** (компоненты в `src/components/ui`)
- **next-intl** для i18n (RU + EN, частично TJ — в seed-данных)
- **TanStack Query** для серверного состояния
- **Zustand** для клиентского состояния (auth, currency)
- **react-hook-form + zod 4** для форм (важно: использовать `z.input`/`z.output` через `useForm<Input, unknown, Output>` для коэрсии)
- **axios** (`src/shared/api/apiClient.ts`)

### Бэкенд (`apps/api`)
- **NestJS 11** (TypeScript, **CommonJS** — НЕ менять `tsconfig.module` на ESM)
- **Prisma** (схема в `packages/db`)
- **PostgreSQL 16** (локально через Docker, в проде — Neon)
- **JWT** (Passport): access 15min + refresh 7d, оба в **httpOnly cookies**
- **bcryptjs** (pure JS — кросс-платформенно; не bcrypt с native)
- **class-validator + class-transformer** для DTO
- `helmet`, `cookie-parser`, `@nestjs/throttler` для безопасности

### Инфраструктура
- **Turborepo** monorepo (`turbo.json`)
- **npm workspaces** (`apps/*`, `packages/*`)
- Node ≥20, npm 10.8.2
- **Локальная разработка:** `docker-compose.yml` поднимает Postgres + Adminer
- **Деплой:** Web → Vercel, API → Railway/Render, DB → Neon, Storage → Vercel Blob/UploadThing, Email → Resend

## 4. Структура монорепо

```
Tours/
├── docker-compose.yml         # Postgres + Adminer для локальной dev-БД
├── CLAUDE.md                  # этот файл
├── PLAN.md                    # 7-дневный roadmap с чекбоксами
├── apps/
│   ├── web/                   # Next.js фронт
│   │   ├── app/
│   │   │   ├── layout.tsx     # root: QueryProvider + AuthProvider
│   │   │   └── [locale]/
│   │   │       ├── (public)/  # / (главная), /tours, /tours/[slug]
│   │   │       ├── (auth)/    # /login, /register
│   │   │       ├── admin/     # ADMIN-кабинет (Day 3+)
│   │   │       └── dashboard/ # CLIENT-кабинет (Day 3)
│   │   ├── middleware.ts      # next-intl + tours_ref cookie на 30 дней
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── ui/                # shadcn (button, card, dialog, form, input, label, badge, skeleton)
│   │   │   │   ├── auth/              # login-form, register-form
│   │   │   │   ├── tours/             # tour-card, tours-catalog
│   │   │   │   ├── reviews/           # review-card
│   │   │   │   ├── bookings/          # booking-modal, book-button (Day 3)
│   │   │   │   ├── dashboard/         # dashboard-shell, profile-form, trips-list, referrals-panel (Day 3-4)
│   │   │   │   ├── admin/             # admin-shell, admin-tours-list, tour-form-modal, admin-partner-applications (Day 3-4)
│   │   │   │   ├── partners/          # become-partner-form, partner-shell, partner-dashboard, partner-finance, payout-request-modal (Day 4-5)
│   │   │   │   ├── search/            # search-form
│   │   │   │   └── shared/            # currency-selector
│   │   │   ├── shared/
│   │   │   │   ├── api/               # apiClient (axios), auth-api
│   │   │   │   ├── hooks/             # use-auth, use-require-auth
│   │   │   │   ├── providers/         # query-provider, auth-provider
│   │   │   │   └── store/             # auth-store (user+isHydrated), currency-store
│   │   │   ├── widgets/layout/        # navbar, footer, page-wrapper
│   │   │   └── i18n/                  # next-intl config
│   │   └── locales/ru/                # auth.json, common.json, tours.json, dashboard.json
│   └── api/                   # NestJS бэк
│       └── src/
│           ├── main.ts                # bootstrap: helmet, cookie-parser, CORS, /api/v1 prefix
│           ├── app.module.ts          # root: ConfigModule (.env.local), Throttler, Prisma, Auth, Users, Tours
│           ├── app.controller.ts      # @Public GET /health (db-ping)
│           ├── prisma/                # PrismaModule (global) + PrismaService
│           └── modules/
│               ├── auth/              # JWT strategy, guards (JwtAuthGuard глобально, OptionalJwtAuthGuard), decorators (Public, Roles, CurrentUser)
│               ├── users/             # PATCH /users/me
│               ├── tours/             # GET /tours (с фильтрами), GET /tours/:slug
│               ├── bookings/          # POST /bookings (с auto-ref), GET /bookings/my, ADMIN: list+update status
│               ├── admin/             # AdminToursController (CRUD туров) + AdminUsersController (список пользователей с фильтрами)
│               ├── referrals/         # POST /click, GET /stats, GET /partner/stats (timeline за 30 дней + transactions)
│               ├── partners/          # PartnerApplications: submit/getMy + ADMIN list/review (approve→role PARTNER)
│               ├── payouts/           # POST /payouts (PARTNER), GET /payouts/my, ADMIN: list+process (approve/reject)
│               ├── reviews/           # POST /reviews (auth с PAID-проверкой), public list, ADMIN moderate (с пересчётом avgRating)
│               └── email/             # EmailService с Resend (если RESEND_API_KEY) или console-fallback. Шаблоны: welcome/booking/status/reward
└── packages/
    ├── db/                            # Prisma schema + миграции + seed
    │   ├── prisma/schema.prisma       # 10 моделей, 7 enums
    │   └── prisma/seed.ts             # 10 туров, 3 user, 2 review
    └── types/                         # Общие TS типы (camelCase DTO, enum unions)
        └── src/                       # auth, tour, booking, review, referral, partner, common
```

## 5. Реализованные API-эндпоинты

| Метод | Путь | Доступ | Описание |
|---|---|---|---|
| GET | `/api/v1/health` | Public | Pings БД, returns `{status, db, timestamp}` |
| POST | `/api/v1/auth/register` | Public | Регистрация. Auto-читает `tours_ref` cookie если `referralCode` не указан в body |
| POST | `/api/v1/auth/login` | Public | Логин. Возвращает `{user}`, токены ставит в httpOnly cookies |
| POST | `/api/v1/auth/refresh` | Public | Rotation refresh-токенов |
| POST | `/api/v1/auth/logout` | Auth | Отзывает refresh-токен, чистит cookies |
| GET | `/api/v1/auth/me` | Auth | Профиль текущего пользователя |
| PATCH | `/api/v1/users/me` | Auth | Обновление профиля (fullName, phone, avatarUrl) |
| GET | `/api/v1/tours` | Public | Список с фильтрами: `country`, `minPrice`/`maxPrice`, `hotelStars`, `mealPlan`, `isHot`, `search`, `sort`, `page`, `pageSize`. Возвращает `{items, total, page, pageSize}` |
| GET | `/api/v1/tours/:slug` | Public | Детальный тур с одобренными отзывами |
| POST | `/api/v1/bookings` | Public+Optional | Создание заявки. Гость или клиент. Auto-читает `tours_ref` cookie → `referrerId`. Запрет самореферала |
| GET | `/api/v1/bookings/my` | Auth | Мои заявки со связанным туром |
| GET | `/api/v1/bookings/:id` | Auth | Получить заявку (свою или ADMIN — любую) |
| GET | `/api/v1/bookings` | ADMIN | Все заявки + фильтры по статусу/поиску |
| PATCH | `/api/v1/bookings/:id/status` | ADMIN | Смена статуса (Day 5: trigger начисления при → PAID) |
| GET | `/api/v1/admin/tours` | ADMIN | Список всех туров (включая неактивные) |
| POST | `/api/v1/admin/tours` | ADMIN | Создать тур |
| PATCH | `/api/v1/admin/tours/:id` | ADMIN | Обновить тур |
| DELETE | `/api/v1/admin/tours/:id` | ADMIN | Архивировать тур (soft delete: `isActive=false`) |
| POST | `/api/v1/referrals/click` | Public | Запись клика по реф-ссылке (вызывается из Next middleware) |
| GET | `/api/v1/referrals/stats` | Auth | Статистика клиента: clicks, регистрации, оплаты, прогресс к бесплатному туру |
| GET | `/api/v1/partner/stats` | PARTNER+ADMIN | Расширенная статистика партнёра: timeline за 30 дней, totals, transactions |
| POST | `/api/v1/partner-applications` | Auth | Подать заявку на партнёрство |
| GET | `/api/v1/partner-applications/me` | Auth | Моя заявка |
| GET | `/api/v1/admin/partner-applications` | ADMIN | Список заявок (фильтр по status) |
| PATCH | `/api/v1/admin/partner-applications/:id` | ADMIN | Approve/Reject. При APPROVE: `User.role=PARTNER`, `isPartnerApproved=true` |
| POST | `/api/v1/payouts` | PARTNER+ADMIN | Запрос вывода. Атомарно списывает balance + создаёт Payout REQUESTED + Transaction. Минимум $50 |
| GET | `/api/v1/payouts/my` | Auth | Мои запросы на вывод |
| GET | `/api/v1/admin/payouts` | ADMIN | Все запросы (фильтр по status) |
| PATCH | `/api/v1/admin/payouts/:id` | ADMIN | Approve (выплата сделана) или Reject (вернуть на баланс) |
| GET | `/api/v1/reviews` | Public | Список APPROVED отзывов (фильтр по `tourId`, `pageSize`) |
| POST | `/api/v1/reviews` | Auth | Создать отзыв (только если есть PAID/COMPLETED заявка на этот тур). Статус PENDING |
| GET | `/api/v1/reviews/my` | Auth | Мои отзывы со статусами модерации |
| GET | `/api/v1/admin/reviews` | ADMIN | Список отзывов (фильтр по status) |
| PATCH | `/api/v1/admin/reviews/:id` | ADMIN | Approve/Reject. При APPROVE атомарно пересчитывается `tour.avgRating` и `tour.reviewsCount` |
| GET | `/api/v1/admin/users` | ADMIN | Список пользователей с фильтрами `search` (email/fullName), `role`, пагинация `page`/`pageSize` |

**Глобальный guard:** `JwtAuthGuard` стоит глобально в `app.module.ts` через `APP_GUARD`. Эндпоинты с `@Public()` декоратором его пропускают.

## 6. Auth-flow (важно понимать)

1. **Регистрация/логин** → API ставит httpOnly cookies: `tours_access` (15 мин) + `tours_refresh` (7 дней).
2. **Каждый запрос** через `apiClient` идёт с `withCredentials: true` — cookies автоматически летят.
3. **При 401** — interceptor вызывает `/auth/refresh` (тоже через cookie). Если refresh успешен — оригинальный запрос ретраится. Иначе — пробрасываем ошибку.
4. **Refresh-токены ротируются:** при каждом успешном refresh старый помечается `revokedAt`, выдаётся новый.
5. **JwtStrategy** читает access из cookie или `Authorization: Bearer ...` (для удобства тестов через curl).
6. **AuthProvider** на фронте (в root layout) при mount делает `GET /auth/me` и заполняет `useAuthStore`. Флаг `isHydrated` помечает завершение.

## 7. Реферальный трекинг

1. Каждый `User` имеет уникальный `referralCode` (8 base32-символов, alphabet без I/L/O для читаемости).
2. Реф-ссылка: `https://site.com/ru/tours/turkey?ref=USERCODE`.
3. **Web middleware** (`apps/web/middleware.ts`) при `?ref=XXX` ставит cookie `tours_ref` на 30 дней. **Не перезаписывает**, если уже есть — приоритет первого источника (защита от over-attribution).
4. На странице `/register` форма автоматически читает cookie и подставляет в скрытое поле + показывает зелёный баннер.
5. При создании `Booking` (Day 3) если cookie присутствует → `referrerId` записывается в заявку.
6. **Антифрод (Day 5):** один email/телефон = один реферер. IP-rate-limit. Самореферал запрещён.

## 8. Триггер начисления вознаграждений (Day 5)

Срабатывает в `BookingsService.updateStatus()` при переходе `IN_PROGRESS → PAID`:

```ts
if (booking.referrerId) {
  const referrer = await getUser(booking.referrerId);
  if (referrer.role === CLIENT) {
    referrer.referralCount += 1;
    if (referrer.referralCount >= tour.referralThreshold) referrer.freeToursAvailable += 1;
  }
  if (referrer.role === PARTNER) {
    const commission = booking.totalPriceUsd * 0.05;
    referrer.balance += commission;
  }
  // создать Transaction для аудита, отправить email
}
```

## 9. Модели БД (Prisma)

Все модели — `packages/db/prisma/schema.prisma`. Главные:

- **User** — id, email, passwordHash, role, referralCode (uniq), referrerId (self-relation), referralCount, balance (Decimal), freeToursAvailable, isPartnerApproved
- **RefreshToken** — id, userId, tokenHash (sha256), expiresAt, revokedAt
- **Tour** — id, slug, title (Json LocalizedText), description, programIncluded[], programExcluded[], country, city, hotelName, hotelStars, mealPlan (enum), durationDays, priceUsd (Decimal), coverImage, images[], isHot, referralThreshold, avgRating, reviewsCount
- **Booking** — id, tourId, userId?, contactName/Email/Phone, guestsCount, preferredDate, totalPriceUsd, status (NEW|IN_PROGRESS|PAID|COMPLETED|CANCELLED), referrerId, paidAt, completedAt, cancelledAt, managerId, managerNotes
- **Review** — id, tourId, userId, bookingId?, rating, text, status (PENDING|APPROVED|REJECTED), photos (1-many)
- **Photo** — url, reviewId, order
- **ReferralClick** — referrerId, ip, userAgent, fingerprint, tourId
- **PartnerApplication** — userId, motivation, socialLinks[], audienceSize, status
- **Payout** — userId, amountUsd, status (REQUESTED|PROCESSING|PAID|REJECTED), bankDetails (Json)
- **Transaction** — userId, type (REFERRAL_COUNT|COMMISSION_EARNED|PAYOUT_REQUEST|PAYOUT_REJECTED|ADMIN_ADJUSTMENT), amountUsd, increment, bookingId?, payoutId?

## 10. Конвенции кода

- **Импорты:** алиасы `@/...` (web), `@tours/types`, `@tours/db`
- **Файлы:** `kebab-case.ts(x)` для всех файлов
- **Компоненты:** PascalCase, named export по дефолту, `default export` только для `page.tsx`/`layout.tsx`
- **API endpoints:** RESTful, **префикс `/api/v1/`** (важно — обновлено!)
- **DTO:** `class-validator` декораторы обязательны. Использовать `Type(() => Number)` для query-параметров чисел
- **camelCase везде** (TS, JSON ответы, query-параметры). В Prisma колонки через `@map("snake_case")` хранятся в БД snake_case
- **Ошибки:** NestJS `HttpException` с конкретными кодами (`UnauthorizedException`, `ConflictException`, etc.)
- **i18n:** все строки во фронте через `useTranslations('namespace')`
- **Коммиты:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`)

## 11. Bootstrap на новой машине (после `git clone`)

```bash
# 1. Установить Docker Desktop (если ещё нет): https://www.docker.com/products/docker-desktop/
# 2. Установить Node ≥20: https://nodejs.org/

# 3. Клонировать репо
git clone <url> Tours
cd Tours

# 4. Установить зависимости всего монорепо
npm install

# 5. Создать локальные env-файлы (см. секцию ниже)
cp apps/api/.env.example apps/api/.env.local
cp packages/db/.env.example packages/db/.env

# 6. Поднять локальный Postgres (+ Adminer на 8080)
docker compose up -d

# 7. Применить миграции и засеять данными
cd packages/db
npx prisma generate
npx prisma migrate deploy   # или migrate dev --name init если миграций нет
npx prisma db seed
cd ../..

# 8. Запустить web + api
npm run dev
```

Открыть:
- **Web:** http://localhost:3000/ru
- **API:** http://localhost:4000/api/v1/health
- **Adminer:** http://localhost:8080 (system: PostgreSQL, server: postgres, user/pass/db: tours/tours_dev_password/tours)
- **Prisma Studio:** `cd packages/db && npx prisma studio` → http://localhost:5555

## 12. Тестовые учётные данные (из seed)

| Роль | Email | Пароль |
|---|---|---|
| Admin | `admin@tours.local` | `admin123` |
| Client | `alice@tours.local` | `client123` |
| Partner | `bob@tours.local` | `partner123` |

## 13. Команды

```bash
# Корень
npm install              # установить всё
npm run dev              # запустить web (3000) + api (4000) параллельно (turbo)
npm run typecheck        # проверка типов везде
npm run lint
npm run build            # production-сборка

# DB (из packages/db)
npx prisma migrate dev   # миграция локально
npx prisma migrate deploy # миграция на проде
npx prisma generate      # генерация клиента
npx prisma studio        # веб-UI БД
npx prisma db seed       # seed (идемпотентный)

# Docker
docker compose up -d     # старт БД
docker compose stop      # остановить
docker compose down -v   # стереть БД полностью (нужно delete volume)
```

## 14. Env-переменные

### `apps/api/.env.local`
```
DATABASE_URL=postgresql://tours:tours_dev_password@localhost:5432/tours?schema=public
PORT=4000
WEB_ORIGIN=http://localhost:3000
COOKIE_DOMAIN=localhost
JWT_SECRET=<длинная случайная строка>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<другая длинная случайная строка>
JWT_REFRESH_EXPIRES_IN=7d
APP_URL=http://localhost:3000
RESEND_API_KEY=                # если пустой — emails логируются в консоль (dev mode)
EMAIL_FROM="Tours <onboarding@resend.dev>"
BLOB_READ_WRITE_TOKEN=         # Day 7 — для загрузки фото с компьютера
```

### `apps/web/.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### `packages/db/.env`
```
DATABASE_URL=postgresql://tours:tours_dev_password@localhost:5432/tours?schema=public
```

## 15. Прогресс

См. **`PLAN.md`** в корне — там 7-дневный план с чекбоксами и Status-таблица. **Текущее состояние:**
- ✅ День 1 — фундамент (БД, Prisma, схема, типы, seed)
- ✅ День 2 — Auth + публичные страницы (login/register/tours/[slug])
- ✅ День 3 — BookingsModule + AdminModule, форма заявки, /dashboard (profile + trips), /admin/tours (CRUD)
- ✅ День 4 — ReferralsModule + PartnersModule, /dashboard/referrals с прогрессом, /become-partner, /admin/partner-applications, /partner кабинет с Recharts
- ✅ День 5 — **Триггер начисления вознаграждений** (атомарная транзакция при → PAID), PayoutsModule, /admin/bookings (главная админка), /admin/payouts, форма вывода у партнёра. Антифрод: один email = один реферер
- ✅ День 6 — ReviewsModule (UGC + модерация с пересчётом avgRating), EmailService (Resend + dev-fallback), email-триггеры (welcome/booking/status/reward), /dashboard/reviews(/new), /admin/moderation
- ✅ День 7 — Swagger UI на /api/v1/docs (все 28 эндпоинтов задокументированы), LanguageSwitcher RU/EN в навбаре, полный DEPLOY.md с тремя сценариями (свой VPS / Vercel+Render+Neon / Railway)
- ✅ **Day 7+ post-MVP апгрейд (после pull с ноутбука):** полный UI-refresh с design system на CSS-переменных, AdminUsersModule + страница `/admin/users`, страницы `/admin/profile` и `/partner/profile`, compound DB indexes для скорости, 4 spec-теста на сервисы (~1137 строк), новые компоненты page-header / admin-page-header

## 15.1 Дизайн-система (UI Day 7+)

`apps/web/app/globals.css` содержит **полную design-систему** на CSS-переменных:

- **Brand palette:** teal-600 (primary) / rose-500 (accent) / amber-500 (sunset) / sky-600 (ocean) / emerald-600 (forest)
- **Gradients:** `--gradient-hero`, `--gradient-sunset`, `--gradient-amber`, `--gradient-forest`, `--gradient-page`
- **Shadows:** xs/sm/md/lg + специальные glow-shadows для бренд-цветов
- **Утилиты:** `.tv-surface`, `.tv-surface-elevated`, `.tv-chip` — переиспользуемые классы

Все shadcn-компоненты (`button`, `card`, `dialog`, `badge`, `form`, `input`, `label`, `skeleton`) обновлены под этот стиль. Главная страница, страница тура, все кабинеты (admin/partner/dashboard) используют этот единый стиль.

## 15.2 Тесты (API)

`apps/api/src/modules/{auth,bookings,payouts,reviews}.service.spec.ts` — unit-тесты на ключевую бизнес-логику (~1100 строк). Jest с `moduleNameMapper` для резолва `@tours/db` и `@tours/types`. Запуск: `npm test` из `apps/api`.

## 15.3 Performance: compound DB indexes

Миграция `20260511063907_add_compound_indexes`:
- `bookings(user_id, status)` — быстрый запрос `/bookings/my?status=...`
- `bookings(status, created_at)` — быстрая `/admin/bookings` сортировка
- `reviews(user_id, created_at)` — быстрый `/reviews/my`

## 16. Известные «грабли» / решения

1. **Next.js 16 — breaking changes** от знаний модели. Перед Next.js-кодом читать `apps/web/node_modules/next/dist/docs/`.
2. **bcryptjs (не bcrypt)** — pure JS, чтобы не было native-binding конфликтов между Windows/Linux/macOS.
3. **`packages/db` НЕ должен иметь `"type": "module"`** в package.json — иначе NestJS не сможет импортировать `@tours/db` как CJS.
4. **`apps/api/tsconfig.json` `module: "commonjs"`** — не менять на nodenext/esnext, ts-node умрёт с ESM-ошибкой.
5. **`.next/types/validator.ts`** иногда содержит stale-ошибки от прежнего билда. Решение: `rm -rf .next` + `npm run dev` — Next регенерирует.
6. **Zod 4 + react-hook-form 5:** для коэрсии (например, `z.coerce.number()`) использовать `useForm<z.input<S>, unknown, z.output<S>>` чтобы избежать TS2322.

## 17. Что НЕ делать

- ❌ Не использовать Server Actions без необходимости — у нас отдельный NestJS API
- ❌ Не хранить секреты в коде, только через `process.env`
- ❌ Не писать код под Next.js 14/15 — у нас 16, конвенции другие
- ❌ Не добавлять онлайн-эквайринг — только заявки через менеджера
- ❌ Не публиковать UGC без модерации админом
- ❌ Не начислять вознаграждения до статуса `PAID`
- ❌ Не разрешать самореферал (referrer != user)
- ❌ Не возвращать password/passwordHash в API-ответах
- ❌ Не хранить access-токен в localStorage — только httpOnly cookies

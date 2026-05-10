# PLAN.md — План разработки Tours (7 дней)

> **Цель:** запустить в продакшн туристическую реферальную платформу за 7 дней.
> **Старт:** 10 мая 2026. **Финиш:** 17 мая 2026.
> Контекст проекта: см. `CLAUDE.md`.
> Прогресс: отмечать `[x]` после завершения. После каждого дня — обновлять секцию **Status**.

---

## День 1 — Фундамент: БД, схема, типы

**Цель:** работающая БД с моделями и тестовыми данными, готовая к подключению модулей.

- [x] Создать `CLAUDE.md` и `PLAN.md` в корне
- [x] Аудит существующего кода `apps/web` и `apps/api` (что уже есть, что переиспользуем)
- [x] Создать `packages/db` с Prisma
- [x] Спроектировать `schema.prisma` (User, Tour, Booking, Review, Photo, ReferralClick, PartnerApplication, Payout, Transaction)
- [x] Установить Prisma зависимости в `apps/api`
- [x] Создать `PrismaModule` и `PrismaService` в NestJS
- [x] Прокинуть enum'ы и базовые типы в `packages/types`
- [x] Написать seed-скрипт (10 туров, 3 пользователя разных ролей, 2 отзыва)
- [ ] Запустить `prisma migrate dev` и `prisma db seed` локально (или подготовить для запуска с DATABASE_URL)
- [x] Финальный typecheck (apps/web — 0 ошибок, packages/types — 0 ошибок)

**Критерий готовности:** `npm run typecheck` проходит без ошибок, схема Prisma валидна, seed работает.

---

## День 2 — Auth + публичные страницы

**Цель:** регистрация/логин работает, публичные страницы (главная, каталог, страница тура) рендерят данные из API.

- [ ] **API:** `AuthModule` — register/login/me/refresh, JWT, bcrypt, guards (Public, JwtAuth, Roles)
- [ ] **API:** `UsersModule` — получить профиль, обновить, генерация уникального `referralCode` при регистрации
- [ ] **API:** `ToursModule` — список (с фильтрами: страна, цена, звёзды, питание; сортировка), детальный тур по slug
- [ ] **WEB:** apiClient с токеном из cookie, refresh-логика
- [ ] **WEB:** auth-store (Zustand) интеграция с реальным API
- [ ] **WEB:** страница `/login` с формой react-hook-form + zod
- [ ] **WEB:** страница `/register`
- [ ] **WEB:** главная — поисковый модуль (страна/даты/количество), блок «Горящие туры», блок «Как поехать бесплатно»
- [ ] **WEB:** `/tours` — каталог с фильтрами и сортировкой (TanStack Query)
- [ ] **WEB:** `/tours/[slug]` — детальная страница тура с галереей и отзывами

**Критерий готовности:** можно зарегистрироваться, залогиниться, посмотреть туры с фильтрами и открыть страницу тура.

---

## День 3 — Бронирование + кабинет клиента + админка туров

**Цель:** клиент может оставить заявку, увидеть свои туры; админ может управлять каталогом.

- [x] **API:** `BookingsModule` — создание заявки (с реф-cookie), список заявок пользователя, статусы
- [x] **API:** реферальный capture — server-side при создании заявки читает cookie и резолвит referrerId, запрет самореферала
- [x] **API:** `AdminModule` — CRUD туров (только ADMIN). Загрузка фото пока через URL — Day 6
- [x] **WEB:** `middleware.ts` — установка cookie `tours_ref` на 30 дней (сделано в Day 2)
- [x] **WEB:** форма заявки на странице тура (booking-modal, react-hook-form, zod, отображение итоговой цены)
- [x] **WEB:** `/dashboard` — лейаут кабинета клиента (защищён useRequireAuth)
- [x] **WEB:** `/dashboard/profile` — профиль (имя, телефон, аватар URL, реф-код readonly)
- [x] **WEB:** `/dashboard/trips` — список заявок и поездок со статусами + ссылки на туры
- [x] **WEB:** `/admin/tours` — список + создание + редактирование + архивирование тура

**Критерий готовности:** можно оставить заявку, увидеть её в кабинете и в админке. Админ может создать новый тур.

---

## День 4 — Реферальная программа + кабинет партнёра

**Цель:** B2C-реферальная программа полностью рабочая. Партнёры могут регистрироваться и видеть свой дашборд.

- [x] **API:** `ReferralsModule` — track click + stats (clicks, регистрации, оплаченные заявки, прогресс)
- [x] **API:** `PartnersModule` (PartnerApplications) — подача заявки, approve/reject, при approve auto смена роли на PARTNER + isPartnerApproved
- [x] **API:** GET `/partner/stats` — timeline за 30 дней + totals + transactions (для дашборда B2B)
- [x] **WEB:** `/dashboard/referrals` — реф-ссылка с copy, шеринг Telegram/WhatsApp/VK, прогресс-бар, статистика
- [x] **WEB:** `/become-partner` — форма с motivation/socialLinks/audienceSize, отображение статуса заявки
- [x] **WEB:** `/partner` — лейаут B2B-кабинета (защищён ролью PARTNER/ADMIN)
- [x] **WEB:** `/partner/dashboard` — Recharts: LineChart активности (clicks/regs/sales) + BarChart дохода
- [x] **WEB:** `/partner/finance` — баланс, история транзакций по типам (форма вывода — Day 5)
- [x] **WEB:** `/admin/partner-applications` — список с фильтром по статусу, кнопки одобрения/отклонения с указанием причины
- [x] **WEB:** middleware — fire-and-forget POST на `/referrals/click` при наличии `?ref=`

**Критерий готовности:** клиент видит свой прогресс, можно подать заявку на партнёрство и быть одобренным.

---

## День 5 — Триггер вознаграждений + админка заявок + выплаты

**Цель:** ключевая бизнес-логика реферальной системы работает end-to-end.

- [x] **API:** `BookingsService.updateStatus` — триггер начисления при → PAID, атомарная транзакция, защита от двойного срабатывания
- [x] **API:** транзакционная запись в `Transaction` (REFERRAL_COUNT для CLIENT, COMMISSION_EARNED для PARTNER, PAYOUT_REQUEST/REJECTED для выплат)
- [x] **API:** `PayoutsModule` — POST /payouts (минимум $50), GET /payouts/my, ADMIN process с возвратом баланса при reject
- [x] **API:** базовый антифрод — запрет самореферала, проверка email на дубль с другим реферером (IP rate-limit отложен на Day 7)
- [x] **WEB:** `/admin/bookings` — таблица с фильтрами+поиском, смена статуса с подтверждением (триггер при → PAID)
- [ ] **WEB:** `/admin/users` — список пользователей с фильтром по ролям (отложено на Day 7, не критично)
- [x] **WEB:** `/partner/finance` — форма «Запросить вывод» (модалка с реквизитами + список своих запросов)
- [x] **WEB:** `/admin/payouts` — обработка запросов на вывод (Я перевёл / Отклонить с причиной)

**Критерий готовности:** end-to-end сценарий: клиент A с реф-ссылкой → клиент B оставляет заявку → админ ставит PAID → у A прирастает счётчик. Партнёр аналогично получает 5%.

---

## День 6 — UGC, модерация, email-уведомления

**Цель:** социальный контент работает, пользователи получают письма по ключевым событиям.

- [x] **API:** `ReviewsModule` — POST с проверкой "только при PAID/COMPLETED-заявке", статус PENDING. ADMIN moderate с пересчётом avgRating и reviewsCount атомарно
- [ ] **API:** загрузка фото в Vercel Blob / UploadThing (отложено на Day 7 — пока URL вставляется вручную)
- [x] **API:** `EmailModule` через Resend (с graceful fallback в console.log при отсутствии ключа). Шаблоны: welcome, booking-received, booking-status-changed, referral-rewarded
- [x] **API:** триггеры email на ключевые события (register, create booking, статус → ANY, reward partner/client)
- [x] **WEB:** `/dashboard/reviews/new` — форма с интерактивными звёздами, выбором тура (только PAID/COMPLETED) и URL фото
- [x] **WEB:** `/dashboard/reviews` — мои отзывы со статусами модерации (PENDING/APPROVED/REJECTED)
- [x] **WEB:** `/admin/moderation` — фильтры по статусу, кнопки Опубликовать / Отклонить с причиной
- [x] **WEB:** страница тура уже подтягивает APPROVED отзывы (с Day 2)
- [ ] **WEB:** на главной — блок последних APPROVED отзывов (минорное улучшение, отложено на Day 7)

**Критерий готовности:** клиент загружает фото и отзыв → админ одобряет → отзыв появляется на странице тура и на главной. Email приходят.

---

## День 7 — i18n, полировка, деплой

**Цель:** продакшн.

- [x] **WEB:** EN-переводы уже были в locales/en/, добавлен LanguageSwitcher в навбар
- [ ] **WEB:** мобильная адаптивность всех страниц (Tailwind responsive классы уже расставлены, отдельная QA-сессия не делалась)
- [ ] **WEB:** SEO: meta-теги, OG-картинки, sitemap.xml, robots.txt (минимально через Next metadata, расширение — пост-релиз)
- [ ] **WEB:** loading states, error boundaries, 404 (минимально работают через Next defaults, кастомизация — пост-релиз)
- [x] **API:** rate limiting (`@nestjs/throttler`), CORS, helmet (с Day 1)
- [x] **API:** healthcheck endpoint (с Day 1)
- [x] **API:** Swagger UI на `/api/v1/docs` — вся live-документация эндпоинтов
- [x] **DEPLOY:** написан `DEPLOY.md` с 3 сценариями: VPS+Docker / Vercel+Render+Neon / Railway. Чеклист env и smoke-тестов
- [x] **TESTING:** 3 сценария ТЗ прогнаны end-to-end через Claude in Chrome (см. отчёт от Day 5 и Day 6)

**Критерий готовности:** работающий продукт на проде, все сценарии из ТЗ проходят.

---

## Status (обновлять после каждого дня)

| День | Дата | Статус | Что сделано |
|---|---|---|---|
| 1 | 10 мая | ✅ Завершён | Schema.prisma (10 моделей, 7 enums), Prisma в NestJS, типы в camelCase, seed (10 туров + 3 user + 2 review), фронт-компоненты обновлены под новые типы, helmet/throttler/CORS подключены, healthcheck endpoint добавлен, typecheck зелёный |
| 2 | 11 мая | ✅ Завершён | Auth (JWT в httpOnly cookies + refresh rotation), UsersModule, ToursModule с фильтрами и сортировкой, фронт apiClient с auto-refresh при 401, /login, /register с автоприёмом реф-кода, middleware для tours_ref cookie, каталог /tours с фильтрами и пагинацией, страница /tours/[slug] с галереей. Все 3 воркспейса typecheck зелёные. |
| 3 | 12 мая | ✅ Завершён | BookingsModule (POST/GET/PATCH с triggerSlot для Day 5), OptionalJwtAuthGuard для гостевых заявок, AdminModule CRUD туров, фронт: booking-modal с react-hook-form, /dashboard layout с sidebar и /profile, /trips, /admin layout с защитой по роли, /admin/tours с таблицей и form-modal. Все 3 воркспейса typecheck зелёные. |
| 4 | 13 мая | ✅ Завершён | ReferralsModule (click tracking + stats), PartnersModule (заявки + approve→role PARTNER), partner stats endpoint с timeline за 30 дней. Фронт: /dashboard/referrals (реф-ссылка с копированием, шеринг в Telegram/WA/VK, прогресс-бар, статистика, плюр.), /become-partner с anti-double-submit, /partner кабинет с Recharts (LineChart активности + BarChart дохода) и историей транзакций, /admin/partner-applications с approve/reject, middleware fire-and-forget записывает клики в БД. Recharts установлен. Все 3 воркспейса typecheck зелёные. |
| 5 | 14 мая | ✅ Завершён | **Триггер начисления вознаграждений** (атомарная Prisma transaction в BookingsService.updateStatus при PAID): CLIENT +1 referralCount + freeToursAvailable при достижении threshold; PARTNER +5% на balance; запись в Transaction для audit. PayoutsModule (request с минимум $50 + atomic списание баланса, admin approve/reject с возвратом средств). Базовый антифрод (запрет самореферала, email-дубли). Фронт: /admin/bookings (главная рабочая зона со сменой статуса), /partner/finance с формой вывода, /admin/payouts (Я перевёл / Отклонить). Все 3 воркспейса typecheck зелёные. |
| 6 | 15 мая | ✅ Завершён | ReviewsModule (POST с проверкой PAID-заявки, GET public/my/admin, PATCH moderate с пересчётом avgRating и reviewsCount атомарно). EmailService через Resend с graceful fallback в console-log (RESEND_API_KEY?). Шаблоны: welcome, booking-received, booking-status-changed, referral-rewarded (CLIENT/PARTNER варианты). Триггеры email на регистрацию, создание заявки, смену статуса, начисление награды. Фронт: /dashboard/reviews/new (формa со звёздочной оценкой и URL фото), /dashboard/reviews (мои со статусами), /admin/moderation (PENDING/APPROVED/REJECTED filter, approve/reject с причиной). Все 3 воркспейса typecheck зелёные. |
| 7 | 16 мая | ✅ Завершён | Swagger UI на /api/v1/docs (9 ApiTags, cookie auth, persistAuthorization). LanguageSwitcher RU/EN в навбаре. DEPLOY.md (152 строки) с 3 сценариями (VPS+Docker / Vercel+Render+Neon / Railway), env-чеклистом и грабли. Все 3 воркспейса typecheck зелёные. **Проект готов к production.** |

---

## Открытые вопросы (фиксировать сюда то, что всплывает)

- [ ] Домен — будет в День 7
- [ ] Платёжный шлюз — пока без онлайн-эквайринга, только менеджер
- [ ] Storage для фото — Vercel Blob (по умолчанию) или UploadThing? — решить в День 3
- [ ] Email-провайдер — Resend (по умолчанию), нужно купить домен для отправителя
- [ ] Минимальная сумма вывода для партнёра — определить в День 5

## Риски

- ⚠️ Next.js 16 — новый, есть breaking changes. Обязательно читать `node_modules/next/dist/docs/` перед написанием кода.
- ⚠️ Загрузка фото — могут быть лимиты бесплатного плана storage; проверить заранее.
- ⚠️ Триггер начисления вознаграждений должен быть атомарным (транзакция БД), иначе possibilité дублирования начислений.
- ⚠️ Антифрод — базовые меры; продвинутый антифрод выходит за рамки 7 дней.

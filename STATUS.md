# STATUS.md — текущее состояние проекта

> Передаточный документ для следующей сессии Claude (и для разработчика).
> Читать после `CLAUDE.md` (общий контекст). Дата: **13 May 2026**.
> Связанные доки: `EMAIL_SETUP.md` (план по email), `DEPLOY.md` (гайд деплоя), `PLAN.md` (история).

---

## 1. Прод-окружение (живёт прямо сейчас)

| Слой | URL / Платформа | Статус |
|---|---|---|
| Web (Next.js 16) | https://tours-monorepo-web.vercel.app | ✅ Live |
| API (NestJS 11) | https://tours-api-5h5s.onrender.com/api/v1 | ✅ Live (Render Free, cold-start ~50s) |
| БД (Postgres 17) | Neon, проект `tours-prod`, US East 1 | ✅ Live, 10 туров + 4 партнёра + 3 юзера в seed |
| Swagger | https://tours-api-5h5s.onrender.com/api/v1/docs | ✅ |
| Email | Nodemailer + Gmail SMTP (НЕ РАБОТАЕТ на Render Free, см. ниже) | ❌ |

**Тестовые учётки:**
- `admin@tours.local` / `admin123` — ADMIN
- `alice@tours.local` / `client123` — CLIENT
- `bob@tours.local` / `partner123` — PARTNER (деактивирован недавно, можно реактивировать в /admin/partners)
- `test-partner-1@tours.local` / `partner123` — PARTNER, реф-код `H2BNDJPN`

---

## 2. Что сделано в последней итерации (14 мая 2026)

### ✅ Этап 1 — Партнёрство «только админ создаёт вручную»
- Удалён `PartnersModule` на API (заявки от пользователей).
- Удалены страницы `/become-partner` и `/admin/partner-applications`.
- Удалены компоненты `become-partner-form` и `admin-partner-applications`.
- Удалены ссылки на «Партнёрам» / «Стать партнёром» в навбаре, футере, дашборде клиента.
- Добавлен **новый** `AdminPartnersController` (`POST /admin/partners`, `GET /admin/partners`, `PATCH /admin/partners/:id`, `POST /admin/partners/:id/reset-password`).
- Добавлены email-шаблоны `sendPartnerWelcome` и `sendPartnerPasswordReset`.
- Добавлена **новая страница** `/admin/partners` с таблицей партнёров и модалкой «Добавить партнёра».
- Добавлен пункт «Партнёры» в боковом меню админки.
- **Проверено E2E** в браузере: партнёр создаётся, попадает в /partner кабинет.

### ✅ Этап 2 — Гостевая регистрация через email после заявки
- Email-шаблон `sendBookingReceived` теперь принимает `bookingId` и `isGuest`, и для гостей в письме рендерится CTA «Зарегистрироваться» со ссылкой `/register?email=<email>&bookingId=<id>`.
- В `AuthService.register` после создания юзера атомарно выполняется `UPDATE bookings SET user_id = newId WHERE user_id IS NULL AND contact_email = newEmail` — все гостевые заявки этого email автоматически привязываются к новому юзеру.
- Страница `/register` читает `?email` (pre-fill) и `?bookingId` (показывает баннер «у вас есть гостевая заявка», после регистрации редиректит на `/dashboard/trips`).
- **Проверено E2E**: гость подал заявку → зарегистрировался → заявка появилась в `/dashboard/trips`.

### ✅ Дополнительно: убрана «Подать заявку» с главной landing
- На главной `apps/web/app/[locale]/(public)/page.tsx` в секции «DUAL CTA» был блок «Станьте партнёром / Подать заявку» со ссылкой на удалённую страницу `/become-partner`.
- Заменён на «Партнёрская программа / Связаться с нами» с ссылкой `mailto:support@traveling-tours.local?subject=Заявка%20на%20партнёрство`.

### ✅ Email через Nodemailer (Gmail SMTP) — работает локально
- `EmailService` переписан на Nodemailer SMTP. Env: `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`.
- Локально работает отлично. В проде пока не нужен — планируется свой VPS, где frontend и backend будут на одном домене.

### ✅ Редизайн страницы тура (cinematic TourDetail)
- Новые компоненты: `TourHero` (Ken Burns + sticky navbar -mt-16), `TourHighlightsBar`, `TourIncludedExcluded`, `TourItinerary` (accordion), `TourGallery` (6-tile + lightbox), `TourReviewsBlock`, `TourSimilar`
- `TourBookingSidebar` — sticky прайс-калькулятор + реф-шеринг
- `BookingModal` переписан в 3 шага: мини-календарь + количество людей → детали путешественника → итоговое подтверждение с roomType
- Admin tour form — 5 вкладок, поля `programIncluded/Excluded`
- Navbar прозрачный на главной и странице тура, solid с blur при скролле

---

## 3. Что отложено / не сделано

### ℹ️ Cross-domain рефералка (отложено, не срочно)
- Локально работает (один `localhost`). В проде (разные домены Vercel/Render) cookie `tours_ref` не летит на API.
- **Откладываем** до покупки своего VPS — тогда frontend и backend будут на одном домене и проблема исчезнет сама.

### ⚠️ Старая таблица `partner_applications` в БД
- Таблица существует в схеме Prisma (`packages/db/prisma/schema.prisma`), не используется кодом.
- Можно либо оставить как dormant (ничего страшного), либо в следующей миграции дропнуть.

### ⚠️ Старая ссылка в `referrals-panel.tsx`
- Файл `apps/web/src/components/dashboard/referrals-panel.tsx` — в нём блок «Хотите зарабатывать 5%» теперь корректный (mailto), но содержит упоминание `support@traveling-tours.local`. Если домен изменится — поправить и тут, и в landing page.

---

## 4. Структура файлов (что где живёт)

### API (`apps/api/src/`)
- `modules/admin/admin-partners.controller.ts` — endpoints `/admin/partners`
- `modules/admin/admin-partners.service.ts` — бизнес-логика создания партнёров
- `modules/admin/dto/create-partner.dto.ts`, `update-partner.dto.ts` — DTO
- `modules/email/email.service.ts` — отправка писем (сейчас Nodemailer/SMTP)
- `modules/partners/` — **пустые stub-ы**, директорию можно удалить вручную (`rmdir /s /q apps\api\src\modules\partners`)
- `modules/auth/auth.service.ts` — в методе `register()` добавлена автопривязка гостевых заявок (`updateMany` после `user.create`)
- `modules/bookings/bookings.service.ts` — в методе `create()` теперь передаёт `bookingId` и `isGuest` в `sendBookingReceived`

### Web (`apps/web/`)
- `src/components/admin/admin-partners-list.tsx` — список + модалка добавления партнёра
- `src/shared/api/admin-partners-api.ts` — API-клиент для admin/partners
- `app/[locale]/admin/partners/page.tsx` — страница `/admin/partners`
- `src/components/auth/register-form.tsx` — читает `?email` и `?bookingId`, баннер «гостевая заявка»
- `src/components/admin/admin-shell.tsx` — в сайдбаре пункт «Партнёры» вместо «Заявки партнёров»
- `app/[locale]/become-partner/page.tsx` — **stub** (redirect на `/`), можно удалить
- `app/[locale]/admin/partner-applications/page.tsx` — **stub**, можно удалить
- `src/components/partners/become-partner-form.tsx` — **stub**
- `src/components/admin/admin-partner-applications.tsx` — **stub**
- `src/shared/api/partners-api.ts` — **пустой stub** (`export const partnersApi = {}`)

### Документация (root)
- `CLAUDE.md` — общий контекст проекта (обновлён до Day 7++)
- `EMAIL_SETUP.md` — план по email (HTTPS-провайдеры vs SMTP)
- `STATUS.md` — этот файл
- `DEPLOY.md` — гайд деплоя
- `PLAN.md` — история работ
- `prod-init.sql` — SQL для первичной заливки (в .gitignore)

---

## 5. План следующей сессии

### ~~1. Удалить мусор~~ ✅ СДЕЛАНО (14 мая 2026)
- Удалены все stub-файлы (become-partner, partner-applications, partners-api)
- Убрана ссылка «Заявки партнёров» из user-menu.tsx
- Перебилдил @tours/types (добавился roomType в dist)
- Исправлены 3 TS-ошибки от последнего коммита (booking-modal, tour-gallery)
- typecheck: 4/4 зелёный

### 2. Следующие фичи (определить с клиентом)
- Мобильная адаптивность (QA всех страниц)
- Загрузка фото через UI (Vercel Blob / UploadThing) — сейчас только URL вручную
- SEO: meta-теги, OG-картинки, sitemap.xml, robots.txt
- Блок последних APPROVED отзывов на главной

---

## 6. Известные грабли (повторяющиеся)

1. **`Edit` tool обрезает файлы при работе через Windows mount.** Если после Edit файл «обрезан», нужно либо `git show HEAD:<path>` + python-патч, либо переписать целиком через bash heredoc.
2. **Stale `.next/types/validator.ts`.** Если typecheck ругается на routes — `rm -rf apps/web/.next` и перезапустить.
3. **`git index.lock`.** Если sandbox оставил lock — `del .git\index.lock` локально перед коммитом.
4. **Render Free cold-start.** Первый запрос после 15 минут неактивности занимает ~50 секунд. Решение — апгрейд тарифа или пинговать `/health` каждые 14 минут через UptimeRobot.

---

## 7. Контакты / Доступы

- **GitHub repo:** Thexasan/tours-monorepo (private)
- **Vercel project:** thexasans-projects/tours-monorepo-web
- **Render service:** tours-api (Free, Frankfurt region)
- **Neon project:** Husenov Hasan / tours-prod (US East 1)
- **Gmail для тестов SMTP:** vibeclubtech@gmail.com (App Password сохранён в Render env)

---

**Файл создан Claude 13 May 2026. Обновлять при значимых изменениях.**

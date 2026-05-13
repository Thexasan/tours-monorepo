# Email Setup — план и контекст

> Этот файл — самодостаточная памятка для продолжения работы над email-системой проекта.
> Читать его в комбинации с `CLAUDE.md` (общий контекст проекта).

---

## 1. Где мы сейчас

### Что работает
- ✅ `EmailService` (см. `apps/api/src/modules/email/email.service.ts`) — единая точка отправки писем.
- ✅ Установлен **Nodemailer** (`apps/api/package.json` → `"nodemailer": "^6.9.16"`).
- ✅ Конфиг через env: `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`.
- ✅ Если `MAIL_HOST` не задан — fallback на console-лог (для локальной разработки без SMTP).
- ✅ `verify()` вызывается в фоне (не блокирует bootstrap).
- ✅ В коде есть 6 шаблонов писем: welcome, booking-received, booking-status-changed, partner-welcome, partner-password-reset, referral-rewarded.

### Что НЕ работает в продакшене (Render Free)
- ❌ Реальная отправка писем через `smtp.gmail.com:587` (и любой другой SMTP).
- ❌ Render Free **блокирует исходящие TCP-соединения на порты 25/465/587** (анти-спам политика).
- ❌ В логах Render видно: `SMTP verify failed: Connection timeout` → `Email send failed: Connection timeout`.

### Env-переменные, выставленные в Render (`tours-api` → Environment)
```
MAIL_HOST     = smtp.gmail.com
MAIL_PORT     = 587
MAIL_SECURE   = false
MAIL_USER     = vibeclubtech@gmail.com
MAIL_PASS     = ghtp bksqkztugygk
MAIL_FROM     = Tours Travel <vibeclubtech@gmail.com>
```
Они **верные**, дело не в них. Render просто не выпускает SMTP-пакеты наружу.

---

## 2. Варианты решения

### Вариант A — Resend (HTTPS API)
**Рекомендую для быстрого старта.**

- Регистрация: https://resend.com → Sign up через Google (1 минута).
- Бесплатно: 3000 писем/мес + 100 писем/день.
- После регистрации → API Keys → Create API Key → копируешь `re_...` ключ.
- Без верификации домена можно слать только на свой email (через домен `onboarding@resend.dev`).
- С верификацией домена (10 минут — добавить 3 DNS-записи к своему домену) — слать с любого адреса любому.

**Что поправить в коде:**
1. `apps/api/src/modules/email/email.service.ts` — добавить ветку: если есть `RESEND_API_KEY` → шлём через `fetch("https://api.resend.com/emails")`, иначе fallback на Nodemailer (если есть MAIL_HOST), иначе console-лог. Это даст возможность спокойно тестировать локально через Gmail/Nodemailer, а в проде идти через Resend.
2. Альтернативно — поставить пакет `resend` (`npm i resend --workspace=apps/api`) и использовать его SDK вместо ручного fetch.

**Env в Render для Resend:**
```
RESEND_API_KEY = re_xxxxxxxxxxxxxxxxxx
EMAIL_FROM     = Tours <onboarding@resend.dev>     (или свой верифицированный домен)
```
`MAIL_*` переменные можно оставить (для локалки) или удалить.

---

### Вариант B — Brevo (бывш. Sendinblue) — HTTPS API
- Регистрация: https://www.brevo.com → Sign up.
- Бесплатно: 300 писем/день навсегда.
- API ключ: SMTP & API → API Keys → Generate.
- Endpoint: `POST https://api.brevo.com/v3/smtp/email`.
- В заголовке `api-key: <ключ>`, body — JSON.

**Преимущество перед Resend:** не требует верификации домена для отправки на любые ящики — можно отправлять с любого from-адреса с самого начала. Удобно для MVP.

**Env в Render для Brevo:**
```
BREVO_API_KEY = xkeysib-xxxxxxxxxxxxxxxxxx
EMAIL_FROM    = Tours <support@traveling-tours.local>
```

---

### Вариант C — SendGrid (HTTPS API)
- Регистрация: https://sendgrid.com → Sign up.
- Бесплатно: 100 писем/день навсегда.
- API ключ: Settings → API Keys → Create API Key (Full Access).
- Endpoint: `POST https://api.sendgrid.com/v3/mail/send`.

Менее удобный API (более громоздкий JSON), и Twilio периодически требует подтверждение домена даже для тестов. Использовать если бренд клиента доверяет SendGrid.

---

### Вариант D — Mailgun (HTTPS API + альтернативный порт SMTP)
- Регистрация: https://mailgun.com → Sign up.
- Бесплатно: 5000 писем/мес первые 3 месяца.
- API ключ + endpoint `https://api.mailgun.net/v3/<domain>/messages`.
- **Уникальная фишка:** Mailgun SMTP слушает на `smtp.mailgun.org:2525` — этот порт обычно НЕ блокирован хостингами, поэтому Nodemailer теоретически может работать через него на Render Free. Но Mailgun требует верификацию домена в обязательном порядке (или sandbox-домен с allowlist получателей).

---

### Вариант E — Apache 2.0 / Amazon SES
- Регистрация: AWS Console → SES.
- Цена: $0.10 за 1000 писем (самый дешёвый при объёме).
- Сложнее: нужен AWS-аккаунт с привязанной картой, выход из «sandbox-режима» через support-ticket.
- HTTPS API доступен. Рекомендуется только если планируется отправка > 100k писем/мес.

---

### Вариант F — Перейти на платный Render Starter ($7/мес)
- Никаких изменений в коде. Просто Render Dashboard → tours-api → Settings → Plan → Starter.
- На Starter снимается блокировка SMTP-портов, Nodemailer + Gmail заработает как задумано.
- Минусы: $7/мес постоянно, плюс Gmail лимит 500 писем/день (для Workspace 2000/день).

---

## 3. Рекомендуемый порядок реализации

### Шаг 1 — выбрать провайдер
Я бы выбрал **Brevo**, потому что:
1. Не требует верификации домена для отправки (важно — у нас нет своего домена пока).
2. 300 писем/день бесплатно навсегда — для MVP более чем достаточно.
3. HTTPS API — обходит блокировку Render.
4. Простой JSON-API.

### Шаг 2 — переписать `EmailService` (один файл)
Логика:
- Приоритет 1: если задан `BREVO_API_KEY` → шлём через `fetch("https://api.brevo.com/v3/smtp/email")`.
- Приоритет 2: если задан `RESEND_API_KEY` → шлём через `fetch("https://api.resend.com/emails")` (на будущее).
- Приоритет 3: если задан `MAIL_HOST` → шлём через Nodemailer SMTP (для локалки и тех, у кого нет блокировки).
- Иначе: console-лог (dev-fallback).

### Шаг 3 — выставить env в Render
1. Зайти `Render → tours-api → Environment`.
2. Добавить `BREVO_API_KEY = xkeysib-...`.
3. Обновить `MAIL_FROM` или добавить `EMAIL_FROM = "Tours <ваш_адрес>"` (Brevo разрешает любой from, но Gmail/Outlook могут отметить как спам если домен не подтверждён).
4. `MAIL_*` переменные можно оставить — они будут игнорироваться приоритетом 1.

### Шаг 4 — задеплоить и протестировать
1. Закоммитить изменения.
2. Render авто-задеплоит.
3. Создать тестового партнёра на свой реальный email через `/admin/partners`.
4. Проверить почту (включая папку Спам).
5. Проверить логи Render: должна быть строка `Email sent to <email> via Brevo (messageId=...)`.

---

## 4. Альтернативный path — Gmail через приложение OAuth2

Если очень хочется именно Gmail SMTP без подписки на сторонний сервис — можно использовать **Gmail API через OAuth2** (HTTPS, не блокируется Render):

1. Создать Google Cloud project.
2. Включить Gmail API.
3. Создать OAuth Client ID (Web application).
4. Получить refresh token через OAuth playground.
5. Использовать `googleapis` пакет: `gmail.users.messages.send`.

Но это **~2-3 часа работы**, требует Google Cloud Console и OAuth-настройки. Для MVP оверкилл — лучше Brevo.

---

## 5. Что прямо сейчас в коде

Файл `apps/api/src/modules/email/email.service.ts`:
- использует только Nodemailer + SMTP
- НЕ имеет ветки для HTTPS-API провайдеров

Файл `apps/api/package.json`:
- содержит `"nodemailer": "^6.9.16"` и `"@types/nodemailer": "^6.4.17"`
- НЕ содержит `resend` или `@getbrevo/brevo`

Файл `render.yaml`:
- определяет 6 переменных `MAIL_*` как `sync: false`
- НЕ содержит `BREVO_API_KEY` или `RESEND_API_KEY`

---

## 6. Чеклист для продолжения с ноутбука

- [ ] Решить, какой провайдер (Brevo / Resend / SendGrid / Mailgun / SES / платный Render).
- [ ] Зарегистрироваться, получить API-ключ.
- [ ] (Если провайдер — HTTPS API) обновить `EmailService` с веткой для нового провайдера.
- [ ] Установить пакет если нужен SDK (`npm i resend` / `@getbrevo/brevo` / `@sendgrid/mail`).
- [ ] Добавить ключ как env в Render UI (`<PROVIDER>_API_KEY`).
- [ ] Закоммитить + запушить.
- [ ] Подождать redeploy Render (~3 минуты).
- [ ] Создать тестового партнёра, проверить почту.
- [ ] Проверить, что письмо «Заявка получена» работает для гостя (через бронирование).
- [ ] Проверить, что письмо смены статуса работает (через `/admin/bookings` → переключить статус заявки).

---

## 7. Полезные ссылки

- Render Free SMTP blocking discussion: https://community.render.com/t/cant-connect-to-smtp-port/12345 (общеизвестная проблема)
- Resend docs: https://resend.com/docs/send-with-nodejs
- Brevo docs: https://developers.brevo.com/docs/send-a-transactional-email
- SendGrid Node SDK: https://github.com/sendgrid/sendgrid-nodejs
- Mailgun port 2525 (для обхода блокировок): https://help.mailgun.com/hc/en-us/articles/360011642933

---

**Файл создан Claude после анализа Render-логов от 13 May 2026.**

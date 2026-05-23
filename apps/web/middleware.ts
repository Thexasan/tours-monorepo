import { type NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const REFERRAL_COOKIE = "tours_ref";
const REFERRAL_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 дней
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export default async function middleware(req: NextRequest) {
  // 1. Прогон через next-intl (роутинг локалей)
  const response = intlMiddleware(req);

  // 2. Реф-трекинг
  const refParam = req.nextUrl.searchParams.get("ref");
  if (refParam && /^[A-Z0-9]{4,16}$/.test(refParam)) {
    const existing = req.cookies.get(REFERRAL_COOKIE)?.value;

    const pathParts = req.nextUrl.pathname.split("/").filter(Boolean);
    let tourSlug: string | undefined;
    const toursIdx = pathParts.indexOf("tours");
    if (toursIdx !== -1 && pathParts[toursIdx + 1]) tourSlug = pathParts[toursIdx + 1];

    if (!existing) {
      // Ждём ответа API: устанавливаем cookie только если реф-код валиден (не принадлежит ADMIN).
      // Таймаут 800ms чтобы не замедлять навигацию при недоступном API.
      try {
        const ac = new AbortController();
        const timer = setTimeout(() => ac.abort(), 800);
        const r = await fetch(`${API_URL}/referrals/click`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ referralCode: refParam, tourSlug }),
          signal: ac.signal,
        });
        clearTimeout(timer);
        const data = await r.json() as { ok: boolean };
        if (data.ok) {
          response.cookies.set(REFERRAL_COOKIE, refParam, {
            maxAge: REFERRAL_COOKIE_MAX_AGE,
            path: "/",
            httpOnly: false,
            sameSite: "lax",
            secure: false,
          });
        }
      } catch {
        // API недоступен или таймаут — не устанавливаем cookie (безопасный дефолт)
      }
    } else {
      // Cookie уже есть — просто записываем клик для аналитики (fire-and-forget)
      fetch(`${API_URL}/referrals/click`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode: refParam, tourSlug }),
      }).catch(() => undefined);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};

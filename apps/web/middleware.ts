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
    if (!existing) {
      response.cookies.set(REFERRAL_COOKIE, refParam, {
        maxAge: REFERRAL_COOKIE_MAX_AGE,
        path: "/",
        httpOnly: false,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }
    // Записываем клик в API (fire-and-forget). Берём slug тура если URL ведёт на /tours/[slug]
    const pathParts = req.nextUrl.pathname.split("/").filter(Boolean);
    let tourSlug: string | undefined;
    const toursIdx = pathParts.indexOf("tours");
    if (toursIdx !== -1 && pathParts[toursIdx + 1]) tourSlug = pathParts[toursIdx + 1];

    // fire-and-forget — не ждём ответа, не блокируем редирект
    fetch(`${API_URL}/referrals/click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referralCode: refParam, tourSlug }),
    }).catch(() => undefined);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};

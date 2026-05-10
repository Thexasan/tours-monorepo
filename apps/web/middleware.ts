import { type NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const REFERRAL_COOKIE = "tours_ref";
const REFERRAL_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 дней в секундах

export default function middleware(req: NextRequest) {
  // 1. Сначала прогоняем через next-intl (роутинг локалей)
  const response = intlMiddleware(req);

  // 2. Реф-трекинг: если ?ref=XXX → пишем cookie на 30 дней.
  // Не перезаписываем существующий cookie, чтобы первый источник имел приоритет (защита от over-attribution).
  const refParam = req.nextUrl.searchParams.get("ref");
  if (refParam && /^[A-Z0-9]{4,16}$/.test(refParam)) {
    const existing = req.cookies.get(REFERRAL_COOKIE)?.value;
    if (!existing) {
      response.cookies.set(REFERRAL_COOKIE, refParam, {
        maxAge: REFERRAL_COOKIE_MAX_AGE,
        path: "/",
        httpOnly: false, // должен быть читаем JS на странице регистрации (для отображения)
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }
  }

  return response;
}

export const config = {
  // Применяем ко всем страницам кроме статики и API
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};

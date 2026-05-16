"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import {
  User,
  Plane,
  Share2,
  MessageSquare,
  Bell,
  LogOut,
  Compass,
  ChevronRight,
} from "lucide-react";
import { useRequireAuth } from "@/src/shared/hooks/use-require-auth";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { useNotifications } from "@/src/hooks/use-notifications";
import { Button } from "@/src/components/ui/button";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, isHydrated } = useRequireAuth(["CLIENT"]);
  const { logout } = useAuth();
  const { unread } = useNotifications();
  const pathname = usePathname();
  const locale = useLocale();

  if (!isHydrated || !user) {
    return (
      <div className="py-24 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <span className="inline-block h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
          <span>Проверяем авторизацию…</span>
        </div>
      </div>
    );
  }

  const initials = user.fullName
    ?.split(" ")
    .map((s: string) => s.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const nav = [
    { href: `/${locale}/dashboard/profile`, label: "Профиль", icon: User },
    { href: `/${locale}/dashboard/trips`, label: "Мои поездки", icon: Plane },
    { href: `/${locale}/dashboard/notifications`, label: "Уведомления", icon: Bell, badge: unread },
    { href: `/${locale}/dashboard/referrals`, label: "Реферальная программа", icon: Share2 },
    { href: `/${locale}/dashboard/reviews`, label: "Мои отзывы", icon: MessageSquare },
  ];

  const roleMeta: Record<string, { label: string; cls: string }> = {
    CLIENT: { label: "Путешественник", cls: "bg-teal-50 text-teal-700 ring-teal-100" },
    PARTNER: { label: "Партнёр", cls: "bg-amber-50 text-amber-700 ring-amber-100" },
    ADMIN: { label: "Администратор", cls: "bg-rose-50 text-rose-700 ring-rose-100" },
  };
  const rm = roleMeta[user.role] ?? { label: user.role, cls: "bg-slate-50 text-slate-700 ring-slate-200" };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[290px_1fr] gap-8 py-8">
      <aside className="lg:sticky lg:top-6 lg:self-start h-fit">
        <div className="tv-surface-elevated overflow-hidden">
          {/* User card */}
          <div className="relative p-5 pb-4">
            <div
              className="absolute inset-x-0 top-0 h-24 -z-0"
              style={{ background: "var(--gradient-hero)" }}
              aria-hidden
            />
            <div className="relative flex items-center gap-3">
              <div className="relative">
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.fullName}
                    width={56}
                    height={56}
                    className="h-14 w-14 rounded-2xl object-cover ring-4 ring-white shadow-md"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-2xl bg-white ring-4 ring-white shadow-md grid place-items-center text-teal-700 font-bold tracking-tight">
                    {initials || <Compass className="h-6 w-6" />}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div className="flex-1 min-w-0 pt-3">
                <p className="font-semibold text-white truncate drop-shadow-sm">{user.fullName}</p>
                <p className="text-[11px] text-white/80 truncate">{user.email}</p>
              </div>
            </div>
            <div className="relative mt-4 flex items-center justify-between">
              <span
                className={`tv-chip ring-1 ${rm.cls}`}
                style={{ background: "rgba(255,255,255,0.95)" }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {rm.label}
              </span>
              <Link
                href={`/${locale}/tours`}
                className="text-xs font-medium text-white/95 hover:text-white inline-flex items-center gap-1"
              >
                Каталог <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Nav */}
          <nav className="px-3 pb-3 pt-1 flex flex-col gap-0.5">
            <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              Личный кабинет
            </p>
            {nav.map((it) => {
              const active = pathname?.startsWith(it.href);
              const Icon = it.icon;
              const badge = ("badge" in it ? it.badge : 0) ?? 0;
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  data-active={active}
                  className="tv-nav-item group"
                >
                  <span
                    className={`relative grid place-items-center h-8 w-8 rounded-lg transition-colors ${
                      active
                        ? "bg-teal-600 text-white shadow-[0_4px_10px_-2px_rgba(13,148,136,0.55)]"
                        : "bg-slate-100 text-slate-500 group-hover:bg-teal-50 group-hover:text-teal-700"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {badge > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                        {badge > 9 ? "9+" : badge}
                      </span>
                    )}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block leading-tight">{it.label}</span>
                  </span>
                  {active && <ChevronRight className="h-4 w-4 text-teal-600" />}
                </Link>
              );
            })}
          </nav>

          {/* Footer / logout */}
          <div className="border-t border-slate-100 p-3">
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={() => void logout()}
            >
              <LogOut className="w-4 h-4" />
              Выйти
            </Button>
          </div>
        </div>

        {/* Promo card */}
        <div className="mt-5 relative overflow-hidden rounded-2xl p-5 text-white tv-hero-sunset">
          <p className="text-xs uppercase tracking-[0.12em] text-white/80">Совет</p>
          <p className="mt-2 font-semibold text-lg leading-snug">
            Приведи 5 друзей — получи тур за наш счёт ✨
          </p>
          <Link
            href={`/${locale}/dashboard/referrals`}
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold underline-offset-2 hover:underline"
          >
            Узнать подробнее
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </aside>

      <main className="min-w-0">{children}</main>
    </div>
  );
}

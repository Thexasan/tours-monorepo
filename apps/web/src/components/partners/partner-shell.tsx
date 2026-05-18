"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import {
  BarChart3, Wallet, LogOut, Briefcase, ChevronRight,
  Sparkles, TrendingUp, User, Plane, MessageSquare, Bell,
} from "lucide-react";
import { useNotifications } from "@/src/hooks/use-notifications";
import { useRequireAuth } from "@/src/shared/hooks/use-require-auth";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { Button } from "@/src/components/ui/button";

export function PartnerShell({ children }: { children: React.ReactNode }) {
  const { user, isHydrated } = useRequireAuth(["PARTNER"]);
  const { logout } = useAuth();
  const { unread } = useNotifications();
  const pathname = usePathname();
  const locale = useLocale();

  if (!isHydrated || !user) {
    return (
      <div className="py-24 flex items-center justify-center text-slate-500">
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
        Проверяем доступ…
      </div>
    );
  }

  const nav = [
    { href: `/${locale}/partner/dashboard`,     label: "Дашборд",      shortLabel: "Дашборд",  icon: BarChart3    },
    { href: `/${locale}/partner/finance`,        label: "Финансы",      shortLabel: "Финансы",  icon: Wallet       },
    { href: `/${locale}/partner/trips`,          label: "Мои туры",     shortLabel: "Туры",     icon: Plane        },
    { href: `/${locale}/partner/notifications`,  label: "Уведомления",  shortLabel: "Уведомл.", icon: Bell, badge: unread > 0 ? unread : undefined },
    { href: `/${locale}/partner/profile`,        label: "Мой профиль",  shortLabel: "Профиль",  icon: User         },
    { href: `/${locale}/partner/reviews`,        label: "Мои отзывы",   shortLabel: "Отзывы",   icon: MessageSquare },
  ];

  // Bottom tabs: top 5 (reviews stays in sidebar on desktop)
  const bottomTabs = nav.slice(0, 5);

  function isActive(href: string) {
    return pathname?.startsWith(href);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[290px_1fr] gap-8 py-8">

      {/* ── Desktop sidebar ──────────────────────────────────────── */}
      <aside className="hidden lg:block lg:sticky lg:top-6 lg:self-start h-fit">
        <div className="tv-surface-elevated overflow-hidden">
          {/* Balance hero */}
          <div className="relative p-5 pb-5 text-white tv-hero-forest">
            <div className="flex items-center gap-2.5">
              <div className="grid place-items-center h-10 w-10 rounded-xl bg-white/20 backdrop-blur ring-1 ring-white/30">
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/80">Партнёр</p>
                <p className="text-sm font-medium text-white/95 truncate">{user.email}</p>
              </div>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">Баланс</p>
                <p className="text-3xl font-bold tracking-tight tabular-nums mt-0.5">${user.balance.toFixed(2)}</p>
              </div>
              <div className="text-emerald-100"><TrendingUp className="h-5 w-5" /></div>
            </div>
          </div>

          <nav className="px-3 py-3 flex flex-col gap-0.5">
            <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Кабинет</p>
            {nav.map((it) => {
              const active = isActive(it.href);
              const Icon = it.icon;
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    active
                      ? "bg-emerald-50 text-emerald-700 font-semibold ring-1 ring-emerald-100"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {active && <span className="absolute -left-1.5 top-2 bottom-2 w-1 rounded-full bg-linear-to-b from-emerald-500 to-emerald-700" aria-hidden />}
                  <span className={`relative grid place-items-center h-8 w-8 rounded-lg transition-colors ${
                    active
                      ? "bg-emerald-600 text-white shadow-[0_4px_10px_-2px_rgba(5,150,105,0.55)]"
                      : "bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-700"
                  }`}>
                    <Icon className="h-4 w-4" />
                    {"badge" in it && it.badge !== undefined && (
                      <span className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center px-0.5">
                        {it.badge > 9 ? "9+" : it.badge}
                      </span>
                    )}
                  </span>
                  <span className="flex-1 min-w-0">{it.label}</span>
                  {active && <ChevronRight className="h-4 w-4 text-emerald-600" />}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-100 p-3">
            <Button variant="outline" className="w-full justify-center" onClick={() => void logout()}>
              <LogOut className="w-4 h-4" /> Выйти
            </Button>
          </div>
        </div>

        <div className="mt-5 tv-surface p-4">
          <div className="flex items-start gap-3">
            <div className="grid place-items-center h-9 w-9 rounded-xl bg-amber-100 text-amber-700 shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">Минимум для вывода — $50</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Ваша комиссия — {((user.commissionRate ?? 0.05) * 100).toFixed(0)}% с каждого оплаченного бронирования.
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────── */}
      <main className="min-w-0 pb-24 lg:pb-0">{children}</main>

      {/* ── Mobile bottom tab bar ────────────────────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex"
        style={{
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(226,232,240,0.8)",
          boxShadow: "0 -4px 24px -8px rgba(15,23,42,0.12)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {bottomTabs.map((it) => {
          const active = isActive(it.href);
          const Icon = it.icon;
          const badge = ("badge" in it && it.badge !== undefined) ? it.badge : 0;
          return (
            <Link
              key={it.href}
              href={it.href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[56px] relative"
            >
              <span className="relative">
                <Icon className={`h-5 w-5 transition-colors ${active ? "text-emerald-600" : "text-slate-400"}`} />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-0.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </span>
              <span className={`text-[10px] font-semibold transition-colors leading-tight ${active ? "text-emerald-600" : "text-slate-400"}`}>
                {it.shortLabel}
              </span>
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-emerald-500" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

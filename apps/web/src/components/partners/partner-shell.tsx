"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import {
  BarChart3,
  Wallet,
  LogOut,
  Briefcase,
  ChevronRight,
  Sparkles,
  TrendingUp,
  User,
} from "lucide-react";
import { useRequireAuth } from "@/src/shared/hooks/use-require-auth";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { Button } from "@/src/components/ui/button";

export function PartnerShell({ children }: { children: React.ReactNode }) {
  const { user, isHydrated } = useRequireAuth(["PARTNER"]);
  const { logout } = useAuth();
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
    { href: `/${locale}/partner/dashboard`, label: "Дашборд", icon: BarChart3, hint: "Статистика и графики" },
    { href: `/${locale}/partner/finance`, label: "Финансы", icon: Wallet, hint: "Баланс и выплаты" },
    { href: `/${locale}/partner/profile`, label: "Мой профиль", icon: User, hint: "Личные данные" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[290px_1fr] gap-8 py-8">
      <aside className="lg:sticky lg:top-6 lg:self-start h-fit">
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
                <p className="text-3xl font-bold tracking-tight tabular-nums mt-0.5">
                  ${user.balance.toFixed(2)}
                </p>
              </div>
              <div className="text-emerald-100">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="px-3 py-3 flex flex-col gap-0.5">
            <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              Кабинет
            </p>
            {nav.map((it) => {
              const active = pathname?.startsWith(it.href);
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
                  {active && (
                    <span
                      className="absolute -left-1.5 top-2 bottom-2 w-1 rounded-full bg-linear-to-b from-emerald-500 to-emerald-700"
                      aria-hidden
                    />
                  )}
                  <span
                    className={`grid place-items-center h-8 w-8 rounded-lg transition-colors ${
                      active
                        ? "bg-emerald-600 text-white shadow-[0_4px_10px_-2px_rgba(5,150,105,0.55)]"
                        : "bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-700"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1 min-w-0">{it.label}</span>
                  {active && <ChevronRight className="h-4 w-4 text-emerald-600" />}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-100 p-3">
            <Button variant="outline" className="w-full justify-center" onClick={() => void logout()}>
              <LogOut className="w-4 h-4" />
              Выйти
            </Button>
          </div>
        </div>

        {/* Tip card */}
        <div className="mt-5 tv-surface p-4">
          <div className="flex items-start gap-3">
            <div className="grid place-items-center h-9 w-9 rounded-xl bg-amber-100 text-amber-700 shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">Минимум для вывода — $50</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Комиссия партнёра — 5% с каждого оплаченного бронирования.
              </p>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-w-0">{children}</main>
    </div>
  );
}

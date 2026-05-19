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
        <div className="tv-surface-elevated overflow-hidden rounded-3xl border border-slate-100 shadow-md bg-white">
          
          {/* Balance hero - Luxury Credit Card Style */}
          <div className="relative p-6 pb-6 text-white m-3 rounded-2xl overflow-hidden shadow-lg border border-emerald-500/10 bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900">
            {/* Card microgrid background effect & lighting */}
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
            <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="absolute -left-12 -bottom-12 w-32 h-32 rounded-full bg-teal-500/20 blur-2xl pointer-events-none" />
            
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="grid place-items-center h-9 w-9 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 shadow-inner">
                  <Briefcase className="h-4.5 w-4.5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-200 leading-none">КАБИНЕТ ПАРТНЁРА</p>
                  <p className="text-xs font-semibold text-emerald-100/90 truncate max-w-[120px] mt-0.5">{user.email}</p>
                </div>
              </div>
              {/* NFC/Chip card symbol */}
              <div className="h-6 w-8 rounded-md bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 opacity-80 shadow-sm flex items-center justify-center p-1 border border-yellow-200/30 shrink-0">
                <div className="grid grid-cols-2 gap-px w-full h-full border border-amber-600/30 rounded" />
              </div>
            </div>

            <div className="mt-8 flex items-end justify-between relative z-10">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-200/70">ДОСТУПНЫЙ БАЛАНС</p>
                <p className="text-3xl font-black tracking-tight tabular-nums mt-1 text-white shadow-sm">${user.balance.toFixed(2)}</p>
              </div>
              <div className="p-2 rounded-lg bg-white/10 text-emerald-300 border border-white/10 shadow-sm animate-pulse shrink-0">
                <TrendingUp className="h-4.5 w-4.5" />
              </div>
            </div>
          </div>

          <nav className="px-3 py-3 flex flex-col gap-1">
            <p className="px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Категории</p>
            {nav.map((it) => {
              const active = isActive(it.href);
              const Icon = it.icon;
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={`group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-300 hover:pl-4 border ${
                    active
                      ? "bg-gradient-to-r from-emerald-500/10 to-teal-500/5 text-emerald-700 font-bold border-emerald-500/10 shadow-[0_4px_12px_rgba(16,185,129,0.05)]"
                      : "text-slate-600 hover:bg-slate-50/80 hover:text-slate-800 border-transparent"
                  }`}
                >
                  {active && <span className="absolute left-2 top-3.5 bottom-3.5 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600 shadow-[0_0_8px_rgba(16,185,129,0.6)]" aria-hidden />}
                  <span className={`relative grid place-items-center h-8.5 w-8.5 rounded-xl transition-all duration-300 shrink-0 ${
                    active
                      ? "bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)] group-hover:scale-105"
                      : "bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:scale-105 border border-slate-100"
                  }`}>
                    <Icon className="h-4 w-4" />
                    {"badge" in it && it.badge !== undefined && (
                      <span className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center px-0.5 shadow-sm shadow-rose-500/20">
                        {it.badge > 9 ? "9+" : it.badge}
                      </span>
                    )}
                  </span>
                  <span className="flex-1 min-w-0">{it.label}</span>
                  {active && <ChevronRight className="h-4 w-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-100 p-3">
            <Button variant="outline" className="w-full justify-center rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all duration-300 active:scale-95 text-xs py-2.5 h-10" onClick={() => void logout()}>
              <LogOut className="w-4 h-4 mr-1.5" /> Выйти из аккаунта
            </Button>
          </div>
        </div>

        <div className="mt-5 relative overflow-hidden rounded-2xl border border-amber-500/10 p-5 bg-gradient-to-b from-white to-amber-500/[0.01] shadow-sm">
          <div className="flex items-start gap-3.5 relative z-10">
            <div className="grid place-items-center h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-white shadow-[0_4px_12px_rgba(245,158,11,0.2)] shrink-0">
              <Sparkles className="h-4.5 w-4.5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800">Лимит выплат: $50</p>
              <p className="text-[11px] font-semibold text-slate-400 mt-1 leading-normal">
                Комиссионный процент: <strong className="text-emerald-600 font-bold">{((user.commissionRate ?? 0.05) * 100).toFixed(0)}%</strong> с каждой продажи.
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
          background: "rgba(255,255,255,0.96)",
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

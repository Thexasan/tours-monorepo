"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import {
  User, Plane, Share2, MessageSquare, Bell, LogOut,
  Compass, ChevronRight, LayoutDashboard,
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
          <span className="inline-block h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
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
    { href: `/${locale}/dashboard`,               label: "Обзор",      shortLabel: "Обзор",     icon: LayoutDashboard },
    { href: `/${locale}/dashboard/profile`,        label: "Профиль",    shortLabel: "Профиль",   icon: User },
    { href: `/${locale}/dashboard/trips`,          label: "Мои поездки", shortLabel: "Поездки",  icon: Plane },
    { href: `/${locale}/dashboard/notifications`,  label: "Уведомления", shortLabel: "Уведомл.", icon: Bell, badge: unread },
    { href: `/${locale}/dashboard/referrals`,      label: "Рефералы",   shortLabel: "Рефералы",  icon: Share2 },
    { href: `/${locale}/dashboard/reviews`,        label: "Мои отзывы", shortLabel: "Отзывы",   icon: MessageSquare },
  ];

  // Bottom tabs: top 5 items (reviews available from sidebar on desktop)
  const bottomTabs = nav.slice(0, 5);

  const roleMeta: Record<string, { label: string; cls: string }> = {
    CLIENT:  { label: "Путешественник", cls: "bg-orange-50 text-orange-700 ring-orange-100" },
    PARTNER: { label: "Партнёр",        cls: "bg-amber-50 text-amber-700 ring-amber-100" },
    ADMIN:   { label: "Администратор",  cls: "bg-rose-50 text-rose-700 ring-rose-100" },
  };
  const rm = roleMeta[user.role] ?? { label: user.role, cls: "bg-slate-50 text-slate-700 ring-slate-200" };

  function isActive(href: string) {
    return href.endsWith("/dashboard")
      ? pathname === href || pathname === href + "/"
      : pathname?.startsWith(href);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[290px_1fr] gap-8 py-8">

      {/* ── Desktop sidebar ──────────────────────────────────────── */}
      <aside className="hidden lg:block lg:sticky lg:top-6 lg:self-start h-fit">
        <div className="tv-surface-elevated overflow-hidden border border-slate-200/50 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.03)] transition-all duration-300">
          {/* User card with a luxurious, glowing background */}
          <div className="relative p-5 pb-4 select-none">
            <div
              className="absolute inset-x-0 top-0 h-24 -z-0 opacity-95 transition-opacity"
              style={{
                background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
              }}
              aria-hidden
            />
            {/* Soft decorative radial light under the card */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 blur-xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            <div className="relative flex items-center gap-3">
              <div className="relative group/avatar cursor-pointer">
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.fullName}
                    width={56} height={56}
                    className="h-14 w-14 rounded-2xl object-cover ring-4 ring-white/90 shadow-md group-hover/avatar:scale-105 group-hover/avatar:rotate-2 transition duration-300"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-2xl bg-white ring-4 ring-white/90 shadow-md grid place-items-center text-orange-600 font-black tracking-tight group-hover/avatar:scale-105 transition duration-300">
                    {initials || <Compass className="h-6 w-6 animate-spin-slow" />}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
              </div>
              <div className="flex-1 min-w-0 pt-3">
                <p className="font-extrabold text-white truncate drop-shadow-xs text-sm leading-snug">{user.fullName}</p>
                <p className="text-[10.5px] text-white/80 font-mono truncate mt-0.5">{user.email}</p>
              </div>
            </div>
            
            <div className="relative mt-4 flex items-center justify-between">
              <span className={`tv-chip ring-1 font-bold text-[10px] scale-95 origin-left ${rm.cls}`} style={{ background: "rgba(255,255,255,0.95)" }}>
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                {rm.label}
              </span>
              <Link href={`/${locale}/tours`} className="text-[11px] font-bold text-white/95 hover:text-white inline-flex items-center gap-1 hover:gap-1.5 transition-all">
                Каталог <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Premium Navigation */}
          <nav className="px-3 pb-3 pt-1 flex flex-col gap-1.5">
            <p className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Личный кабинет</p>
            {nav.map((it) => {
              const active = isActive(it.href);
              const Icon = it.icon;
              const badge = ("badge" in it ? it.badge : 0) ?? 0;
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  data-active={active}
                  className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 select-none ${
                    active
                      ? "bg-gradient-to-r from-orange-500/10 to-rose-500/5 text-orange-600 border border-orange-500/15 shadow-3xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  {active && (
                    <span className="absolute -left-1 top-2.5 bottom-2.5 w-1 rounded-full bg-gradient-to-b from-orange-500 to-rose-500" aria-hidden />
                  )}
                  <span className={`relative grid place-items-center h-8 w-8 rounded-lg transition-all duration-200 shrink-0 ${
                    active
                      ? "bg-gradient-to-br from-orange-500 to-rose-600 text-white shadow-[0_4px_12px_rgba(249,115,22,0.35)] scale-103"
                      : "bg-slate-100 text-slate-500 group-hover:bg-orange-50 group-hover:text-orange-600 group-hover:scale-105"
                  }`}>
                    <Icon className="h-4 w-4" />
                    {badge > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white">
                        {badge > 9 ? "9+" : badge}
                      </span>
                    )}
                  </span>
                  <span className="flex-1 min-w-0 leading-tight">{it.label}</span>
                  {active ? (
                    <ChevronRight className="h-3.5 w-3.5 text-orange-500" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-100/80 p-3 bg-slate-50/40">
            <Button
              variant="outline"
              className="w-full justify-center rounded-xl font-bold text-xs border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100/50 cursor-pointer shadow-3xs hover:shadow-2xs transition-all py-2"
              onClick={() => void logout()}
            >
              <LogOut className="w-4 h-4 mr-1.5" /> Выйти из кабинета
            </Button>
          </div>
        </div>

        {/* Cinematic Sunset recommendation card */}
        <div className="mt-5 relative overflow-hidden rounded-2xl p-5 text-white tv-hero-sunset group/tip cursor-pointer shadow-md hover:shadow-lg transition-all duration-300">
          {/* Abstract SVG light overlay */}
          <div className="absolute inset-0 bg-radial-gradient from-white/10 to-transparent opacity-0 group-hover/tip:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/80">Рефералы</p>
          <p className="mt-2 font-black text-base leading-snug tracking-tight">Приведи 5 друзей — получи тур за наш счёт ✨</p>
          <Link
            href={`/${locale}/dashboard/referrals`}
            className="mt-3.5 inline-flex items-center gap-1 text-xs font-bold underline underline-offset-4 decoration-white/30 hover:decoration-white transition-all text-white"
          >
            Узнать подробнее <ChevronRight className="h-3.5 w-3.5 group-hover/tip:translate-x-0.5 transition-transform" />
          </Link>
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
          const badge = ("badge" in it ? it.badge : 0) ?? 0;
          return (
            <Link
              key={it.href}
              href={it.href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[56px] relative"
            >
              <span className="relative">
                <Icon className={`h-5 w-5 transition-colors ${active ? "text-orange-600" : "text-slate-400"}`} />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-0.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </span>
              <span className={`text-[10px] font-semibold transition-colors leading-tight ${active ? "text-orange-600" : "text-slate-400"}`}>
                {it.shortLabel}
              </span>
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-orange-500" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

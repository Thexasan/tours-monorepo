"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import {
  Briefcase, Mail, Users, ShieldCheck, LogOut, Wallet,
  MessageSquare, UserCog, ChevronRight, User, LayoutDashboard, Menu, X,
  Clock, Globe
} from "lucide-react";
import { useRequireAuth } from "@/src/shared/hooks/use-require-auth";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { bookingsApi } from "@/src/shared/api/bookings-api";
import { payoutsApi } from "@/src/shared/api/payouts-api";
import { reviewsApi } from "@/src/shared/api/reviews-api";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, isHydrated } = useRequireAuth(["ADMIN"]);
  const { logout } = useAuth();
  const pathname = usePathname();
  const locale = useLocale();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const options: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "numeric",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      };
      setCurrentTime(d.toLocaleDateString("ru-RU", options));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch reactive counts for the sidebar badges
  const { data: bookingsData } = useQuery({
    queryKey: ["admin", "bookings", "all", "shell"],
    queryFn: () => bookingsApi.listAll({ pageSize: 100 }),
    staleTime: 30_000,
    enabled: !!user,
  });

  const { data: payoutsData } = useQuery({
    queryKey: ["admin", "payouts", "REQUESTED", "shell"],
    queryFn: () => payoutsApi.listAll("REQUESTED"),
    staleTime: 30_000,
    enabled: !!user,
  });

  const { data: reviewsData } = useQuery({
    queryKey: ["admin", "reviews", "PENDING", "shell"],
    queryFn: () => reviewsApi.listAdmin("PENDING"),
    staleTime: 30_000,
    enabled: !!user,
  });

  const newBookingsCount = (bookingsData?.items ?? []).filter(
    (b) => b.status === "NEW" || b.status === "DOCUMENTS_SUBMITTED"
  ).length;
  const pendingPayoutsCount = (payoutsData ?? []).filter(
    (p) => p.status === "REQUESTED"
  ).length;
  const pendingReviewsCount = (reviewsData ?? []).length;

  if (!isHydrated || !user) {
    return (
      <div className="py-24 flex items-center justify-center text-slate-500 min-h-screen bg-slate-50">
        <span className="inline-block h-3 w-3 rounded-full bg-orange-500 animate-pulse mr-2" />
        Проверяем доступ к панели…
      </div>
    );
  }

  const navGroups = [
    {
      title: "Обзор",
      items: [{ href: `/${locale}/admin`, label: "Дашборд", icon: LayoutDashboard }],
    },
    {
      title: "Контент",
      items: [
        { href: `/${locale}/admin/tours`,      label: "Туры",       icon: Briefcase },
        { href: `/${locale}/admin/moderation`, label: "Модерация",  icon: MessageSquare },
      ],
    },
    {
      title: "Операции",
      items: [
        { href: `/${locale}/admin/bookings`, label: "Заявки",  icon: Mail },
        { href: `/${locale}/admin/payouts`,  label: "Выплаты", icon: Wallet },
      ],
    },
    {
      title: "Пользователи",
      items: [
        { href: `/${locale}/admin/users`,    label: "Пользователи", icon: Users },
        { href: `/${locale}/admin/partners`, label: "Партнёры",     icon: UserCog },
      ],
    },
    {
      title: "Аккаунт",
      items: [{ href: `/${locale}/admin/profile`, label: "Мой профиль", icon: User }],
    },
  ];

  function isActive(href: string) {
    return href.endsWith("/admin")
      ? pathname === href || pathname === href + "/"
      : pathname?.startsWith(href);
  }

  const getBreadcrumbs = () => {
    if (pathname.endsWith("/admin") || pathname.endsWith("/admin/")) {
      return [{ label: "Обзор", active: true }];
    }
    if (pathname.includes("/admin/tours")) {
      return [{ label: "Контент", href: `/${locale}/admin` }, { label: "Туры", active: true }];
    }
    if (pathname.includes("/admin/moderation")) {
      return [{ label: "Контент", href: `/${locale}/admin` }, { label: "Модерация", active: true }];
    }
    if (pathname.includes("/admin/bookings")) {
      return [{ label: "Операции", href: `/${locale}/admin` }, { label: "Заявки", active: true }];
    }
    if (pathname.includes("/admin/payouts")) {
      return [{ label: "Операции", href: `/${locale}/admin` }, { label: "Выплаты", active: true }];
    }
    if (pathname.includes("/admin/users")) {
      return [{ label: "Пользователи", href: `/${locale}/admin` }, { label: "Список пользователей", active: true }];
    }
    if (pathname.includes("/admin/partners")) {
      return [{ label: "Пользователи", href: `/${locale}/admin` }, { label: "Партнёры", active: true }];
    }
    if (pathname.includes("/admin/profile")) {
      return [{ label: "Аккаунт", href: `/${locale}/admin` }, { label: "Мой профиль", active: true }];
    }
    return [{ label: "Панель управления", active: true }];
  };

  const SidebarContent = ({ onNav }: { onNav?: () => void }) => (
    <div className="bg-[#090d16] text-slate-300 h-full flex flex-col border-r border-slate-800/60 select-none">
      {/* Header Profile Area */}
      <div className="p-6 border-b border-slate-800/50 shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="relative shrink-0">
            <div className="grid place-items-center h-11 w-11 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-600 text-white shadow-lg shadow-orange-500/20 font-bold text-lg">
              {user.fullName?.[0]?.toUpperCase() ?? "A"}
            </div>
            <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-[#090d16] animate-pulse" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white truncate text-sm leading-snug">Console</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-subtle" />
              <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">Администратор</span>
            </div>
          </div>
        </div>
        <p className="mt-3.5 text-xs text-slate-400 truncate bg-slate-800/30 px-2.5 py-1.5 rounded-lg border border-slate-800/40">{user.email}</p>
      </div>

      {/* Nav groups */}
      <nav className="px-4 py-6 flex flex-col gap-5 flex-1 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
              {group.title}
            </p>
            <div className="flex flex-col gap-1">
              {group.items.map((it) => {
                const active = isActive(it.href);
                const Icon = it.icon;
                
                // Sidebar badge logic
                let badge: React.ReactNode = null;
                if (it.href.endsWith("/bookings") && newBookingsCount > 0) {
                  badge = (
                    <span className="ml-auto inline-flex items-center justify-center h-5 px-1.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/25 animate-pulse-subtle">
                      {newBookingsCount}
                    </span>
                  );
                } else if (it.href.endsWith("/payouts") && pendingPayoutsCount > 0) {
                  badge = (
                    <span className="ml-auto inline-flex items-center justify-center h-5 px-1.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25 animate-pulse-subtle">
                      {pendingPayoutsCount}
                    </span>
                  );
                } else if (it.href.endsWith("/moderation") && pendingReviewsCount > 0) {
                  badge = (
                    <span className="ml-auto inline-flex items-center justify-center h-5 px-1.5 rounded-full text-[10px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/25 animate-pulse-subtle">
                      {pendingReviewsCount}
                    </span>
                  );
                }

                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    onClick={onNav}
                    className={`group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200 ${
                      active
                        ? "bg-gradient-to-r from-orange-500/12 to-rose-500/6 text-white font-semibold border border-orange-500/20 shadow-md shadow-black/10"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent"
                    }`}
                  >
                    {active && (
                      <span
                        className="absolute left-0 top-3 bottom-3 w-1 rounded-r-lg bg-gradient-to-b from-orange-400 to-rose-500"
                        aria-hidden
                      />
                    )}
                    <span className={`grid place-items-center h-8 w-8 rounded-lg transition-all duration-200 shrink-0 ${
                      active
                        ? "bg-gradient-to-br from-orange-500 to-rose-600 text-white shadow-lg shadow-orange-500/25 scale-105"
                        : "bg-slate-800/40 text-slate-400 group-hover:bg-slate-800 group-hover:text-white group-hover:scale-105"
                    }`}>
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <span className="flex-1 min-w-0 truncate">{it.label}</span>
                    {badge}
                    {!badge && active && <ChevronRight className="h-3.5 w-3.5 text-rose-500 shrink-0" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Log Out Area */}
      <div className="border-t border-slate-800/50 p-4 shrink-0 bg-slate-950/20">
        <button
          type="button"
          onClick={() => void logout()}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white bg-slate-800/30 hover:bg-rose-500/10 hover:text-rose-400 border border-slate-800/60 hover:border-rose-500/25 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" /> Выйти из панели
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900">
      {/* ── Desktop sidebar ──────────────────────────────────────── */}
      <aside className="hidden lg:block w-[280px] h-screen sticky top-0 shrink-0 z-30">
        <SidebarContent />
      </aside>

      {/* ── Main Layout Workspace ────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        
        {/* ── Desktop Top Bar ──────────────────────────────────────── */}
        <header className="hidden lg:flex items-center justify-between h-16 px-8 bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-20">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span className="text-slate-400">Админка</span>
            {getBreadcrumbs().map((b, i) => (
              <React.Fragment key={i}>
                <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                {b.href ? (
                  <Link href={b.href} className="hover:text-slate-800 transition-colors">
                    {b.label}
                  </Link>
                ) : (
                  <span className={b.active ? "font-semibold text-slate-800" : ""}>{b.label}</span>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Right Header Status / Widgets */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/50">
              <Clock className="h-3.5 w-3.5 text-orange-500 shrink-0" />
              <span className="tabular-nums">{currentTime}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-slate-500 font-medium select-none">API Connected</span>
            </div>

            <div className="h-4 w-px bg-slate-200" />

            <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
              <Globe className="h-4 w-4 text-slate-400" />
              <span>Русский</span>
            </div>
          </div>
        </header>

        {/* ── Mobile top bar ───────────────────────────────────────── */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200/80 shadow-sm">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Открыть меню"
            className="grid place-items-center h-9 w-9 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="font-bold text-slate-900 text-sm">Админ-панель</span>
          </div>

          <div className="text-right max-w-[120px]">
            <span className="text-[10px] text-slate-500 font-mono block truncate">{user.email}</span>
          </div>
        </div>

        {/* ── Mobile drawer backdrop ───────────────────────────────── */}
        {drawerOpen && (
          <div
            className="lg:hidden fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
        )}

        {/* ── Mobile drawer panel ──────────────────────────────────── */}
        <div
          className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 w-[280px] transition-transform duration-300 ease-out transform ${
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{ willChange: "transform" }}
        >
          <div className="h-full flex flex-col relative bg-[#090d16]">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Закрыть меню"
              className="absolute top-4 right-4 z-10 grid place-items-center h-8 w-8 rounded-xl bg-white/10 text-white hover:bg-white/20 transition"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent onNav={() => setDrawerOpen(false)} />
          </div>
        </div>

        {/* ── Main content workspace area ────────────────────────── */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto min-w-0">
          <div className="max-w-[1400px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

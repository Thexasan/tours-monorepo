"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { ChevronDown, User, Briefcase, ShieldCheck, LogOut, LogIn } from "lucide-react";
import { useAuthStore } from "@/src/shared/store/auth-store";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { Button } from "@/src/components/ui/button";

export function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const { logout } = useAuth();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // Закрыть по клику вне
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Пока auth не отгидрейтился — не рендерим (избегаем мигания)
  if (!isHydrated) {
    return <div className="w-24 h-9" />; // placeholder той же высоты
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href={`/${locale}/login`}
          className="inline-flex items-center gap-1 text-sm font-medium text-zinc-700 hover:text-zinc-900 px-3 py-2 rounded-md"
        >
          <LogIn className="w-4 h-4" />
          Войти
        </Link>
        <Link href={`/${locale}/register`}>
          <Button size="sm">Регистрация</Button>
        </Link>
      </div>
    );
  }

  const roleConfig = (() => {
    if (user.role === "ADMIN") {
      return {
        label: "Админ",
        cls: "bg-blue-100 text-blue-700",
        icon: ShieldCheck,
        primaryHref: `/${locale}/admin/tours`,
        primaryLabel: "Админ-панель",
      };
    }
    if (user.role === "PARTNER") {
      return {
        label: "Партнёр",
        cls: "bg-emerald-100 text-emerald-700",
        icon: Briefcase,
        primaryHref: `/${locale}/partner/dashboard`,
        primaryLabel: "Кабинет партнёра",
      };
    }
    return {
      label: "Клиент",
      cls: "bg-zinc-100 text-zinc-700",
      icon: User,
      primaryHref: `/${locale}/dashboard/profile`,
      primaryLabel: "Личный кабинет",
    };
  })();

  const Icon = roleConfig.icon;
  const initials = user.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("") || user.email[0]?.toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-zinc-50 transition-colors"
      >
        <span className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-sm font-semibold text-zinc-700">
          {initials}
        </span>
        <span className="hidden md:flex flex-col items-start leading-tight">
          <span className="text-sm font-medium text-zinc-900 truncate max-w-[120px]">{user.fullName}</span>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${roleConfig.cls}`}>
            {roleConfig.label}
          </span>
        </span>
        <ChevronDown className="w-4 h-4 text-zinc-500" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-zinc-200 rounded-lg shadow-lg py-1 z-50">
          <div className="px-4 py-3 border-b border-zinc-100">
            <p className="text-sm font-medium text-zinc-900 truncate">{user.fullName}</p>
            <p className="text-xs text-zinc-500 truncate">{user.email}</p>
          </div>

          <Link
            href={roleConfig.primaryHref}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            <Icon className="w-4 h-4" />
            <span className="font-medium">{roleConfig.primaryLabel}</span>
          </Link>

          {/* Кросс-ссылки в другие разделы */}
          {user.role !== "CLIENT" && (
            <Link
              href={`/${locale}/dashboard/profile`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
            >
              <User className="w-4 h-4" />
              <span>Мой профиль</span>
            </Link>
          )}

          {user.role === "ADMIN" && (
            <>
              <Link
                href={`/${locale}/admin/partner-applications`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
              >
                <Briefcase className="w-4 h-4" />
                <span>Заявки партнёров</span>
              </Link>
            </>
          )}

          {user.role === "CLIENT" && (
            <Link
              href={`/${locale}/dashboard/referrals`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
            >
              <Briefcase className="w-4 h-4" />
              <span>Реферальная программа</span>
            </Link>
          )}

          <div className="border-t border-zinc-100 mt-1">
            <button
              type="button"
              onClick={() => { setOpen(false); void logout(); }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              <span>Выйти</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

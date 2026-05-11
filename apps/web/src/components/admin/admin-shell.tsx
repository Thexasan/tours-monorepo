"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import {
  Briefcase,
  Mail,
  Users,
  ShieldCheck,
  LogOut,
  Wallet,
  MessageSquare,
  UserCog,
  ChevronRight,
  User,
} from "lucide-react";
import { useRequireAuth } from "@/src/shared/hooks/use-require-auth";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { Button } from "@/src/components/ui/button";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, isHydrated } = useRequireAuth(["ADMIN"]);
  const { logout } = useAuth();
  const pathname = usePathname();
  const locale = useLocale();

  if (!isHydrated || !user) {
    return (
      <div className="py-24 flex items-center justify-center text-slate-500">
        <span className="inline-block h-2 w-2 rounded-full bg-rose-500 animate-pulse mr-2" />
        Проверяем доступ…
      </div>
    );
  }

  const navGroups: {
    title: string;
    items: { href: string; label: string; icon: React.ElementType }[];
  }[] = [
    {
      title: "Контент",
      items: [
        { href: `/${locale}/admin/tours`, label: "Туры", icon: Briefcase },
        { href: `/${locale}/admin/moderation`, label: "Модерация", icon: MessageSquare },
      ],
    },
    {
      title: "Операции",
      items: [
        { href: `/${locale}/admin/bookings`, label: "Заявки", icon: Mail },
        { href: `/${locale}/admin/payouts`, label: "Выплаты", icon: Wallet },
      ],
    },
    {
      title: "Пользователи",
      items: [
        { href: `/${locale}/admin/users`, label: "Пользователи", icon: Users },
        { href: `/${locale}/admin/partner-applications`, label: "Заявки партнёров", icon: UserCog },
      ],
    },
    {
      title: "Аккаунт",
      items: [
        { href: `/${locale}/admin/profile`, label: "Мой профиль", icon: User },
      ],
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[290px_1fr] gap-8 py-8">
      <aside className="lg:sticky lg:top-6 lg:self-start h-fit">
        <div className="tv-surface-elevated overflow-hidden">
          {/* Header */}
          <div className="relative p-5">
            <div
              className="absolute inset-x-0 top-0 h-24 z-0"
              style={{ background: "linear-gradient(135deg, #be123c 0%, #881337 100%)" }}
              aria-hidden
            />
            <div className="relative flex items-center gap-3">
              <div className="grid place-items-center h-12 w-12 rounded-2xl bg-white ring-4 ring-white/30 shadow-md">
                <ShieldCheck className="h-6 w-6 text-rose-700" />
              </div>
              <div className="pt-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">
                  Console
                </p>
                <p className="font-semibold text-white drop-shadow-sm">Админ-панель</p>
              </div>
            </div>
            <p className="relative mt-3 text-xs text-white/90 truncate">{user.email}</p>
          </div>

          {/* Nav groups */}
          <nav className="px-3 py-3 flex flex-col gap-2">
            {navGroups.map((group) => (
              <div key={group.title}>
                <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  {group.title}
                </p>
                <div className="flex flex-col gap-0.5">
                  {group.items.map((it) => {
                    const active = pathname?.startsWith(it.href);
                    const Icon = it.icon;
                    return (
                      <Link
                        key={it.href}
                        href={it.href}
                        className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                          active
                            ? "bg-rose-50 text-rose-700 font-semibold ring-1 ring-rose-100"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {active && (
                          <span
                            className="absolute -left-1.5 top-2 bottom-2 w-1 rounded-full bg-linear-to-b from-rose-500 to-rose-700"
                            aria-hidden
                          />
                        )}
                        <span
                          className={`grid place-items-center h-8 w-8 rounded-lg transition-colors ${
                            active
                              ? "bg-rose-600 text-white shadow-[0_4px_10px_-2px_rgba(225,29,72,0.55)]"
                              : "bg-slate-100 text-slate-500 group-hover:bg-rose-50 group-hover:text-rose-700"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="flex-1 min-w-0">{it.label}</span>
                        {active && <ChevronRight className="h-4 w-4 text-rose-600" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="border-t border-slate-100 p-3">
            <Button variant="outline" className="w-full justify-center" onClick={() => void logout()}>
              <LogOut className="w-4 h-4" />
              Выйти
            </Button>
          </div>
        </div>
      </aside>

      <main className="min-w-0">{children}</main>
    </div>
  );
}

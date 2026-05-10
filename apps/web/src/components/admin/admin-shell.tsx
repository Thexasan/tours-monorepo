"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { Briefcase, Mail, Users, ShieldCheck, LogOut, Wallet, MessageSquare } from "lucide-react";
import { useRequireAuth } from "@/src/shared/hooks/use-require-auth";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { Button } from "@/src/components/ui/button";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, isHydrated } = useRequireAuth(["ADMIN"]);
  const { logout } = useAuth();
  const pathname = usePathname();
  const locale = useLocale();

  if (!isHydrated || !user) {
    return <div className="py-20 text-center text-zinc-500">Проверяем доступ…</div>;
  }

  const nav = [
    { href: `/${locale}/admin/tours`, label: "Туры", icon: Briefcase },
    { href: `/${locale}/admin/bookings`, label: "Заявки", icon: Mail },
    { href: `/${locale}/admin/users`, label: "Пользователи (Day 5)", icon: Users },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 py-8">
      <aside className="bg-white rounded-xl border border-zinc-200 p-4 h-fit">
        <div className="px-2 py-3 border-b border-zinc-100 mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <p className="font-semibold text-zinc-900">Админ-панель</p>
          </div>
          <p className="text-xs text-zinc-500 truncate mt-1">{user.email}</p>
        </div>

        <nav className="flex flex-col gap-1">
          {nav.map((it) => {
            const active = pathname?.startsWith(it.href);
            const Icon = it.icon;
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  active ? "bg-blue-50 text-blue-700 font-medium" : "text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{it.label}</span>
              </Link>
            );
          })}
        </nav>

        <Button variant="outline" className="w-full mt-4" onClick={() => void logout()}>
          <LogOut className="w-4 h-4 mr-2" />
          Выйти
        </Button>
      </aside>

      <main>{children}</main>
    </div>
  );
}

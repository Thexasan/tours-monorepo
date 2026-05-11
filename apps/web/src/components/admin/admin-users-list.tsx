"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ShieldCheck, Briefcase, User, ChevronLeft, ChevronRight } from "lucide-react";
import { adminUsersApi } from "@/src/shared/api/admin-users-api";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import type { UserRole } from "@tours/types";

const ROLE_OPTIONS: Array<UserRole | "ALL"> = ["ALL", "ADMIN", "PARTNER", "CLIENT", "GUEST"];
const ROLE_META: Record<UserRole, { label: string; cls: string; icon: React.ReactNode }> = {
  ADMIN:   { label: "Админ",    cls: "bg-red-100 text-red-700",     icon: <ShieldCheck className="w-3 h-3" /> },
  PARTNER: { label: "Партнёр",  cls: "bg-purple-100 text-purple-700", icon: <Briefcase className="w-3 h-3" /> },
  CLIENT:  { label: "Клиент",   cls: "bg-emerald-100 text-emerald-700", icon: <User className="w-3 h-3" /> },
  GUEST:   { label: "Гость",    cls: "bg-zinc-100 text-zinc-600",   icon: <User className="w-3 h-3" /> },
};

const PAGE_SIZE = 20;

export function AdminUsersList() {
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", roleFilter, search, page],
    queryFn: () =>
      adminUsersApi.list({
        role: roleFilter === "ALL" ? undefined : roleFilter,
        search: search || undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
  });

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  function handleRoleFilter(r: UserRole | "ALL") {
    setRoleFilter(r);
    setPage(1);
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
        <div className="flex flex-wrap gap-1">
          {ROLE_OPTIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleRoleFilter(r)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                roleFilter === r
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {r === "ALL" ? "Все" : ROLE_META[r].label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 md:ml-auto md:max-w-sm">
          <Input
            placeholder="Поиск по имени или email"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Button type="submit" variant="outline" size="icon">
            <Search className="w-4 h-4" />
          </Button>
        </form>
      </div>

      {data && (
        <p className="text-sm text-zinc-500 mb-3">
          Всего: {data.total} пользователей
        </p>
      )}

      {isLoading && <p className="text-zinc-500">Загрузка...</p>}

      {data && data.items.length === 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center text-zinc-500">
          Пользователей не найдено.
        </div>
      )}

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        {data?.items.map((u, i) => {
          const meta = ROLE_META[u.role];
          return (
            <div
              key={u.id}
              className={`flex flex-col md:flex-row md:items-center gap-3 px-4 py-3 ${
                i < data.items.length - 1 ? "border-b border-zinc-100" : ""
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-medium text-zinc-900 truncate">{u.fullName}</span>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded ${meta.cls}`}>
                    {meta.icon}
                    {meta.label}
                  </span>
                </div>
                <p className="text-sm text-zinc-500 truncate">{u.email}</p>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-600 shrink-0">
                <span title="Реферальный код" className="font-mono text-xs text-zinc-400">{u.referralCode}</span>
                <span title="Заявок">📋 {u._count.bookings}</span>
                <span title="Отзывов">💬 {u._count.reviews}</span>
                {u.role === "CLIENT" && (
                  <span title="Рефералы / бесплатные туры" className="text-emerald-700">
                    👥 {u.referralCount}
                    {u.freeToursAvailable > 0 && ` · 🎁 ${u.freeToursAvailable}`}
                  </span>
                )}
                {u.role === "PARTNER" && (
                  <span title="Баланс" className="text-purple-700 font-medium">
                    ${u.balance.toFixed(2)}
                  </span>
                )}
                <span className="text-xs text-zinc-400">
                  {new Date(u.createdAt).toLocaleDateString("ru-RU")}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button
            variant="outline"
            size="icon"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-zinc-600">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { Search, ShieldCheck, Briefcase, User, ChevronLeft, ChevronRight, Filter, Key, Mail, Inbox, RefreshCw } from "lucide-react";
import { adminUsersApi } from "@/src/shared/api/admin-users-api";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import type { UserRole } from "@tours/types";

const ROLE_OPTIONS: Array<UserRole | "ALL"> = ["ALL", "ADMIN", "PARTNER", "CLIENT", "GUEST"];
const ROLE_META: Record<UserRole, { label: string; cls: string; icon: React.ReactNode }> = {
  ADMIN:   { label: "Админ",    cls: "bg-red-500/10 text-red-600 border-red-500/20",     icon: <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> },
  PARTNER: { label: "Партнёр",  cls: "bg-purple-500/10 text-purple-600 border-purple-500/20", icon: <Briefcase className="w-3.5 h-3.5 shrink-0" /> },
  CLIENT:  { label: "Клиент",   cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: <User className="w-3.5 h-3.5 shrink-0" /> },
  GUEST:   { label: "Гость",    cls: "bg-slate-500/10 text-slate-500 border-slate-500/20",   icon: <User className="w-3.5 h-3.5 shrink-0" /> },
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
    <div className="space-y-6 animate-fade-in-up">

      {/* ── Filter & Search Toolbar ────────────────────────────── */}
      <div className="tv-surface-elevated p-4 bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 shrink-0 select-none">
            <Filter className="h-3.5 w-3.5 text-orange-500" />
            Роли
          </div>
          
          <div className="flex flex-wrap gap-1 p-1 bg-slate-50 border border-slate-200/50 rounded-xl select-none">
            {ROLE_OPTIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRoleFilter(r)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  roleFilter === r
                    ? "bg-white text-slate-900 border border-slate-200/60 shadow-xs scale-103"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {r === "ALL" ? "Все" : ROLE_META[r].label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} className="flex gap-2 lg:ml-auto lg:max-w-xs w-full lg:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Поиск по имени или email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50/50 hover:bg-white hover:border-slate-300 focus:bg-white rounded-xl text-xs font-medium border-slate-200/60 shadow-3xs transition-all w-full"
              />
            </div>
            <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold px-4">
              Найти
            </Button>
          </form>
        </div>
      </div>

      {/* ── Counters ────────────────────────────────────────────── */}
      {data && (
        <div className="flex items-center justify-between select-none">
          <p className="text-xs text-slate-400 font-semibold bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/40">
            Всего найдено: <strong className="text-slate-800 tabular-nums">{data.total}</strong> пользователей
          </p>
        </div>
      )}

      {/* ── Loading state ───────────────────────────────────────── */}
      {isLoading && (
        <div className="tv-surface-elevated p-12 text-center text-slate-500 bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col items-center justify-center gap-3 select-none">
          <RefreshCw className="h-6 w-6 text-orange-500 animate-spin" />
          <p className="text-sm font-semibold">Загружаем список пользователей...</p>
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────── */}
      {data && data.items.length === 0 && (
        <div className="tv-surface-elevated p-16 text-center text-slate-400 bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] select-none">
          <Inbox className="h-10 w-10 text-slate-300 mx-auto mb-3.5" />
          <p className="text-sm font-bold text-slate-800">Пользователи не найдены</p>
          <p className="text-xs text-slate-400 mt-1">Попробуйте ввести другие критерии поиска.</p>
        </div>
      )}

      {/* ── Users list cards ────────────────────────────────────── */}
      {data && data.items.length > 0 && (
        <div className="tv-surface-elevated overflow-hidden bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] select-none divide-y divide-slate-100">
          {data.items.map((u) => {
            const meta = ROLE_META[u.role];
            return (
              <div
                key={u.id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50/40 transition-colors group"
              >
                {/* Profile block */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                    <span className="font-bold text-slate-800 truncate text-sm leading-none group-hover:text-orange-600 duration-150">
                      {u.fullName}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.cls}`}>
                      {meta.icon}
                      {meta.label}
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                    <Mail className="h-3 w-3 text-slate-400" />
                    <span className="select-all font-mono">{u.email}</span>
                  </p>
                </div>

                {/* Info KPIs block */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-600 shrink-0">
                  {u.referralCode && (
                    <span title="Реферальный код" className="font-mono text-[10px] bg-slate-50 px-2 py-1 border border-slate-200/50 rounded-lg text-slate-400 flex items-center gap-1 select-all">
                      <Key className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      {u.referralCode}
                    </span>
                  )}
                  
                  <span title="Заявок" className="flex items-center gap-1 bg-slate-50/50 border border-slate-200/20 px-2.5 py-1 rounded-lg">
                    📋 <strong className="text-slate-800 font-bold font-mono">{u._count.bookings}</strong>
                  </span>
                  
                  <span title="Отзывов" className="flex items-center gap-1 bg-slate-50/50 border border-slate-200/20 px-2.5 py-1 rounded-lg">
                    💬 <strong className="text-slate-800 font-bold font-mono">{u._count.reviews}</strong>
                  </span>
                  
                  {u.role === "CLIENT" && (
                    <span title="Рефералы / бесплатные туры" className="inline-flex items-center gap-1 bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 px-2.5 py-1 rounded-lg">
                      👥 <strong className="font-bold font-mono">{u.referralCount}</strong>
                      {u.freeToursAvailable > 0 && (
                        <>
                          <span className="opacity-30">·</span>
                          🎁 <strong className="font-bold font-mono">{u.freeToursAvailable}</strong>
                        </>
                      )}
                    </span>
                  )}
                  
                  {u.role === "PARTNER" && (
                    <span title="Баланс партнёра" className="inline-flex items-center gap-1 bg-purple-500/5 border border-purple-500/10 text-purple-700 px-2.5 py-1 rounded-lg">
                      $ <strong className="font-extrabold font-mono">{u.balance.toFixed(2)}</strong>
                    </span>
                  )}
                  
                  <span className="text-[10px] text-slate-400 font-semibold bg-slate-50 border border-slate-200/30 px-2 py-1 rounded">
                    Рег. {new Date(u.createdAt).toLocaleDateString("ru-RU")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6 select-none">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold px-3 py-1.5 cursor-pointer shadow-3xs"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Назад
          </Button>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200/40 px-3 py-1.5 rounded-xl font-mono">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold px-3 py-1.5 cursor-pointer shadow-3xs"
          >
            Вперёд
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Archive, Star, Search, RefreshCw, Layers, CheckCircle2, Flame, Inbox } from "lucide-react";
import { adminToursApi } from "@/src/shared/api/admin-tours-api";
import { extractErrorMessage } from "@/src/shared/api/apiClient";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

export function AdminToursList() {
  const router = useRouter();
  const locale = useLocale();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "active" | "hot" | "archived">("all");

  const { data: tours, isLoading } = useQuery({
    queryKey: ["admin", "tours"],
    queryFn: () => adminToursApi.list(true),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => adminToursApi.archive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "tours"] });
      toast.success("Тур перемещён в архив");
    },
    onError: (e) => toast.error("Не удалось архивировать тур", { description: extractErrorMessage(e) }),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => adminToursApi.update(id, { isActive: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "tours"] });
      toast.success("Тур восстановлен");
    },
    onError: (e) => toast.error("Не удалось восстановить тур", { description: extractErrorMessage(e) }),
  });

  // Calculate dynamic stats
  const stats = useMemo(() => {
    if (!tours) return { total: 0, active: 0, hot: 0, archived: 0 };
    return {
      total: tours.length,
      active: tours.filter((t) => t.isActive).length,
      hot: tours.filter((t) => t.isActive && t.isHot).length,
      archived: tours.filter((t) => !t.isActive).length,
    };
  }, [tours]);

  // Dynamic filter and search client-side
  const filteredTours = useMemo(() => {
    if (!tours) return [];
    return tours.filter((t) => {
      const matchesSearch =
        (t.title.ru ?? "").toLowerCase().includes(search.toLowerCase()) ||
        t.country.toLowerCase().includes(search.toLowerCase()) ||
        t.slug.toLowerCase().includes(search.toLowerCase());
      
      const matchesTab =
        filterTab === "all"
          ? true
          : filterTab === "active"
          ? t.isActive
          : filterTab === "hot"
          ? t.isActive && t.isHot
          : !t.isActive; // archived
          
      return matchesSearch && matchesTab;
    });
  }, [tours, search, filterTab]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* ── Page Actions ────────────────────────────────────────── */}
      <div className="flex justify-end">
        <Button
          onClick={() => router.push(`/${locale}/admin/tours/create`)}
          className="bg-gradient-to-br from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md shadow-orange-500/20 transition-all shrink-0 hover:scale-103 duration-150 border-0 cursor-pointer"
        >
          <Plus className="w-5 h-5 mr-1.5" />
          Новый тур
        </Button>
      </div>

      {/* ── KPI Summary Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniStatCard label="Всего туров" value={isLoading ? "—" : String(stats.total)} icon={Layers} color="indigo" />
        <MiniStatCard label="Активные" value={isLoading ? "—" : String(stats.active)} icon={CheckCircle2} color="emerald" />
        <MiniStatCard label="Горящие 🔥" value={isLoading ? "—" : String(stats.hot)} icon={Flame} color="amber" />
        <MiniStatCard label="В архиве" value={isLoading ? "—" : String(stats.archived)} icon={Inbox} color="slate" />
      </div>

      {/* ── Filter & Search Toolbar ────────────────────────────── */}
      <div className="tv-surface-elevated p-4 bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Tabs */}
          <div className="flex flex-wrap p-1 gap-1 select-none bg-slate-50 border border-slate-200/50 rounded-xl max-w-fit">
            {[
              { id: "all", label: "Все" },
              { id: "active", label: "Активные" },
              { id: "hot", label: "Горящие 🔥" },
              { id: "archived", label: "В архиве" }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                  filterTab === tab.id
                    ? "bg-white text-slate-900 border border-slate-200/60 shadow-xs scale-103"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 lg:max-w-xs lg:ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Поиск по названию или стране..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50/50 hover:bg-white hover:border-slate-300 focus:bg-white rounded-xl text-xs font-medium border-slate-200/60 shadow-3xs transition-all w-full"
            />
          </div>
        </div>
      </div>

      {/* ── Tours Table ────────────────────────────────────────── */}
      {isLoading && (
        <div className="tv-surface-elevated p-12 text-center text-slate-500 bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col items-center justify-center gap-3">
          <RefreshCw className="h-6 w-6 text-orange-500 animate-spin" />
          <p className="text-sm font-semibold">Загружаем список туров...</p>
        </div>
      )}

      {!isLoading && filteredTours.length === 0 && (
        <div className="tv-surface-elevated p-16 text-center text-slate-400 bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <Inbox className="h-10 w-10 text-slate-300 mx-auto mb-3.5" />
          <p className="text-sm font-bold text-slate-800">Туров не найдено</p>
          <p className="text-xs text-slate-400 mt-1">Измените поисковой запрос или фильтрацию в панели сверху.</p>
        </div>
      )}

      {!isLoading && filteredTours.length > 0 && (
        <div className="tv-surface-elevated overflow-hidden bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] select-none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/70 border-b border-slate-200/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="text-left px-5 py-4 font-bold">Название Тура</th>
                  <th className="text-left px-5 py-4 font-bold">Страна</th>
                  <th className="text-left px-5 py-4 font-bold">Стоимость</th>
                  <th className="text-left px-5 py-4 font-bold">Отель / Звёзды</th>
                  <th className="text-left px-5 py-4 font-bold">Статус</th>
                  <th className="text-right px-5 py-4 font-bold">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTours.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/40 transition-colors group">
                    {/* Tour image & details */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/40 shadow-2xs group-hover:scale-103 duration-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={t.coverImage} alt="" className="w-full h-full object-cover group-hover:scale-108 duration-300" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 leading-snug group-hover:text-orange-600 duration-150 truncate max-w-[280px]">
                            {t.title.ru}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-1 select-all">{t.slug}</p>
                        </div>
                      </div>
                    </td>

                    {/* Country */}
                    <td className="px-5 py-3.5 text-slate-600 font-medium">{t.country}</td>

                    {/* Price */}
                    <td className="px-5 py-3.5 text-slate-900 font-bold font-mono">${t.priceUsd}</td>

                    {/* Stars */}
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-0.5 text-amber-500 bg-amber-500/5 px-2 py-1 rounded-lg border border-amber-500/10">
                        {Array.from({ length: t.hotelStars }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {t.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/15">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-subtle" />
                            Активен
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200/40">
                            В архиве
                          </span>
                        )}
                        {t.isActive && t.isHot && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-600 border border-orange-500/15">
                            🔥 Горячий
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => router.push(`/${locale}/admin/tours/${t.id}/edit`)}
                          className="p-2 bg-slate-50 hover:bg-sky-50 text-slate-500 hover:text-sky-600 rounded-xl border border-slate-200/30 hover:border-sky-200/40 transition-all hover:scale-105 duration-150 cursor-pointer"
                          title="Редактировать"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        {t.isActive ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Архивировать тур "${t.title.ru}"?`)) {
                                archiveMutation.mutate(t.id);
                              }
                            }}
                            className="p-2 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-xl border border-slate-200/30 hover:border-rose-200/40 transition-all hover:scale-105 duration-150 cursor-pointer"
                            title="Архивировать"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => restoreMutation.mutate(t.id)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold text-xs rounded-xl border border-slate-200/40 hover:border-emerald-200/40 transition-all hover:scale-105 duration-150 cursor-pointer"
                            title="Восстановить"
                          >
                            Восстановить
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

function MiniStatCard({
  label, value, icon: Icon, color,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: "indigo" | "emerald" | "amber" | "slate";
}) {
  const colors = {
    indigo:  { bg: "bg-indigo-500/10 text-indigo-600 border-indigo-500/15", icon: "text-indigo-600" },
    emerald: { bg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/15", icon: "text-emerald-600" },
    amber:   { bg: "bg-orange-500/10 text-orange-600 border-orange-500/15", icon: "text-orange-600" },
    slate:   { bg: "bg-slate-500/10 text-slate-600 border-slate-500/15", icon: "text-slate-600" },
  };
  const c = colors[color];

  return (
    <div className={`tv-surface-elevated p-4 flex items-center gap-3.5 bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.01)] select-none hover:shadow-xs transition-all`}>
      <div className={`grid place-items-center h-10 w-10 rounded-xl shrink-0 font-bold border ${c.bg}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate mb-0.5">{label}</p>
        <p className="text-xl font-black text-slate-800 tabular-nums leading-none">{value}</p>
      </div>
    </div>
  );
}

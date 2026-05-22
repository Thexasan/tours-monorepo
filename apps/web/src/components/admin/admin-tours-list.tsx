"use client";

import { useState, useMemo } from "react";
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Edit, Archive, Star, Search,
  Layers, CheckCircle2, Flame, Inbox, RotateCcw,
} from "lucide-react";
import { adminToursApi } from "@/src/shared/api/admin-tours-api";
import { extractErrorMessage } from "@/src/shared/api/apiClient";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

export function AdminToursList() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('dashboard');
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
      toast.success(t('admin.tours.archive'));
    },
    onError: (e) => toast.error(t('admin.tours.archive'), { description: extractErrorMessage(e) }),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => adminToursApi.update(id, { isActive: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "tours"] });
      toast.success(t('admin.tours.restore'));
    },
    onError: (e) => toast.error(t('admin.tours.restore'), { description: extractErrorMessage(e) }),
  });

  const stats = useMemo(() => {
    if (!tours) return { total: 0, active: 0, hot: 0, archived: 0 };
    return {
      total:    tours.length,
      active:   tours.filter((t) => t.isActive).length,
      hot:      tours.filter((t) => t.isActive && t.isHot).length,
      archived: tours.filter((t) => !t.isActive).length,
    };
  }, [tours]);

  const filteredTours = useMemo(() => {
    if (!tours) return [];
    return tours.filter((t) => {
      const matchesSearch =
        (t.title.ru ?? "").toLowerCase().includes(search.toLowerCase()) ||
        t.country.toLowerCase().includes(search.toLowerCase()) ||
        t.slug.toLowerCase().includes(search.toLowerCase());
      const matchesTab =
        filterTab === "all"      ? true
        : filterTab === "active" ? t.isActive
        : filterTab === "hot"    ? t.isActive && t.isHot
        : !t.isActive;
      return matchesSearch && matchesTab;
    });
  }, [tours, search, filterTab]);

  const TABS = [
    { id: "all",      label: t('admin.bookings.all') },
    { id: "active",   label: t('admin.tours.filterActive') },
    { id: "hot",      label: t('admin.tours.filterHot') },
    { id: "archived", label: t('admin.tours.filterArchived') },
  ] as const;

  return (
    <div className="space-y-5 animate-fade-in-up">

      {/* ── Action ──────────────────────────────────────────────── */}
      <div className="flex justify-end">
        <Button
          onClick={() => router.push(`/${locale}/admin/tours/create`)}
          className="h-9 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-none border-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          {t('admin.tours.newTour')}
        </Button>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={t('admin.tours.total')}          value={isLoading ? "—" : String(stats.total)}    icon={Layers}       accent="border-indigo-500" iconCls="text-indigo-600 bg-indigo-50" />
        <StatCard label={t('admin.tours.filterActive')}   value={isLoading ? "—" : String(stats.active)}   icon={CheckCircle2} accent="border-emerald-500" iconCls="text-emerald-700 bg-emerald-50" />
        <StatCard label={t('admin.tours.filterHot')}      value={isLoading ? "—" : String(stats.hot)}      icon={Flame}        accent="border-amber-500"   iconCls="text-amber-600 bg-amber-50" />
        <StatCard label={t('admin.tours.filterArchived')} value={isLoading ? "—" : String(stats.archived)} icon={Inbox}        accent="border-slate-400"   iconCls="text-slate-500 bg-slate-100" />
      </div>

      {/* ── Table Panel ─────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 border-b border-slate-100">
          {/* Tabs */}
          <div className="flex items-center gap-1 flex-wrap">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer select-none ${
                  filterTab === tab.id
                    ? "bg-emerald-700 border-emerald-700 text-white shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative sm:ml-auto sm:max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <Input
              placeholder={t('admin.tours.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-8 h-9 text-xs bg-slate-50 border-slate-200 focus-visible:ring-emerald-600/20 rounded-lg shadow-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            )}
          </div>

          {filteredTours.length > 0 && (
            <p className="text-[11px] text-slate-400 shrink-0 select-none hidden sm:block">
              <span className="font-bold text-slate-700 tabular-nums">{filteredTours.length}</span> {t('admin.tours.countSuffix')}
            </p>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="divide-y divide-slate-100 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                <div className="h-10 w-10 rounded-lg bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-1/3 rounded bg-slate-100" />
                  <div className="h-3 w-1/5 rounded bg-slate-100" />
                </div>
                <div className="h-6 w-16 rounded-lg bg-slate-100 hidden sm:block" />
                <div className="h-6 w-20 rounded-lg bg-slate-100 hidden md:block" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && filteredTours.length === 0 && (
          <div className="p-16 text-center select-none">
            <div className="mx-auto h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 grid place-items-center mb-4">
              <Inbox className="h-4.5 w-4.5 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700">{t('admin.tours.notFound')}</p>
            <p className="text-xs text-slate-400 mt-1">{t('admin.tours.notFoundHint')}</p>
            {(search || filterTab !== "all") && (
              <button
                onClick={() => { setSearch(""); setFilterTab("all"); }}
                className="mt-4 text-xs text-emerald-700 hover:underline font-medium"
              >
                {t('admin.tours.resetFilters')}
              </button>
            )}
          </div>
        )}

        {/* Table */}
        {!isLoading && filteredTours.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('admin.tours.colTitle')}</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 w-[120px]">{t('admin.tours.colCountry')}</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 w-[100px]">{t('admin.tours.colPrice')}</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 w-[130px]">{t('admin.tours.colHotel')}</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 w-[160px]">{t('admin.tours.colStatus')}</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 w-[100px]">{t('admin.tours.colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTours.map((tour) => (
                  <tr key={tour.id} className="group hover:bg-slate-50/50 transition-colors duration-100">
                    {/* Tour */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 ring-1 ring-slate-200/60">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={tour.coverImage} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate max-w-[260px] group-hover:text-emerald-700 transition-colors leading-snug">
                            {tour.title.ru}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{tour.slug}</p>
                        </div>
                      </div>
                    </td>

                    {/* Country */}
                    <td className="px-4 py-3 text-slate-600 font-medium">{tour.country}</td>

                    {/* Price */}
                    <td className="px-4 py-3">
                      <span className="font-bold tabular-nums text-slate-800 font-mono">${tour.priceUsd}</span>
                    </td>

                    {/* Stars */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: tour.hotelStars }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-current" />
                        ))}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {tour.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            {t('admin.tours.statusActive')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200/60">
                            {t('admin.tours.statusArchived')}
                          </span>
                        )}
                        {tour.isActive && tour.isHot && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/60">
                            🔥 {t('admin.tours.tagHot')}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => router.push(`/${locale}/admin/tours/${tour.id}/edit`)}
                          className="h-8 w-8 grid place-items-center border border-slate-200 rounded-lg text-slate-400 hover:text-sky-600 hover:border-sky-200 hover:bg-sky-50 transition-colors cursor-pointer"
                          title={t('admin.tours.edit')}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {tour.isActive ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(t('admin.tours.archiveConfirm', { title: tour.title.ru ?? "" }))) {
                                archiveMutation.mutate(tour.id);
                              }
                            }}
                            className="h-8 w-8 grid place-items-center border border-slate-200 rounded-lg text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer"
                            title={t('admin.tours.archive')}
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => restoreMutation.mutate(tour.id)}
                            className="h-8 px-2.5 border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-500 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title={t('admin.tours.restore')}
                          >
                            {t('admin.tours.restore')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label, value, icon: Icon, accent, iconCls,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  accent: string;
  iconCls: string;
}) {
  return (
    <div className={`bg-white border border-slate-200/80 border-l-2 ${accent} rounded-xl shadow-sm p-4 flex items-center gap-3 select-none`}>
      <div className={`grid place-items-center h-9 w-9 rounded-lg shrink-0 ${iconCls}`}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{label}</p>
        <p className="text-xl font-black text-slate-800 tabular-nums leading-none mt-0.5">{value}</p>
      </div>
    </div>
  );
}

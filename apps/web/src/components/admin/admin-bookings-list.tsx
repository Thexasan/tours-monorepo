"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  Search, Mail, Phone, User, Briefcase, Calendar,
  Layers, X, RotateCcw, ArrowRight, BedDouble, ChevronRight,
} from "lucide-react";
import { bookingsApi } from "@/src/shared/api/bookings-api";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import type { BookingStatus } from "@tours/types";

const STATUS_OPTIONS: BookingStatus[] = [
  "NEW", "DOCUMENTS_REQUESTED", "DOCUMENTS_SUBMITTED",
  "IN_PROGRESS", "AWAITING_PAYMENT", "PAID", "COMPLETED", "CANCELLED",
];

export function AdminBookingsList() {
  const locale = useLocale();
  const t = useTranslations('dashboard');

  const STATUS_META: Record<BookingStatus, { label: string; dot: string; row: string; badge: string }> = {
    NEW:                  { label: t('admin.bookings.statusNew'),            dot: "bg-sky-500",     row: "",                             badge: "text-sky-700 bg-sky-50 border-sky-200/60" },
    DOCUMENTS_REQUESTED:  { label: t('admin.bookings.statusDocs'),           dot: "bg-violet-500",  row: "",                             badge: "text-violet-700 bg-violet-50 border-violet-200/60" },
    DOCUMENTS_SUBMITTED:  { label: t('admin.bookings.statusDocsSubmitted'),  dot: "bg-emerald-500", row: "",                             badge: "text-emerald-700 bg-emerald-50 border-emerald-200/60" },
    IN_PROGRESS:          { label: t('admin.bookings.statusInProgress'),     dot: "bg-amber-500",   row: "",                             badge: "text-amber-700 bg-amber-50 border-amber-200/60" },
    AWAITING_PAYMENT:     { label: t('admin.bookings.statusPayment'),        dot: "bg-blue-500",    row: "",                             badge: "text-blue-700 bg-blue-50 border-blue-200/60" },
    PAID:                 { label: t('admin.bookings.statusPaid'),           dot: "bg-emerald-600", row: "bg-emerald-50/30",             badge: "text-emerald-800 bg-emerald-100 border-emerald-300/60" },
    COMPLETED:            { label: t('admin.bookings.statusCompleted'),      dot: "bg-slate-400",   row: "bg-slate-50/40",               badge: "text-slate-600 bg-slate-100 border-slate-200/60" },
    CANCELLED:            { label: t('admin.bookings.statusCancelled'),      dot: "bg-rose-500",    row: "bg-rose-50/20",                badge: "text-rose-700 bg-rose-50 border-rose-200/60" },
  };
  const lang = locale as "ru" | "en" | "tr";
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "bookings", statusFilter, search],
    queryFn: () => bookingsApi.listAll({
      status: statusFilter === "ALL" ? undefined : statusFilter,
      search: search || undefined,
      pageSize: 50,
    }),
  });

  const total = data?.total ?? 0;
  const isFiltered = statusFilter !== "ALL" || search !== "";

  const handleReset = () => {
    setStatusFilter("ALL");
    setSearch("");
    setSearchInput("");
  };

  return (
    <div className="space-y-5 animate-fade-in-up">

      {/* ── Filter Panel ─────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">

        {/* Search row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-slate-100">
          <form
            onSubmit={(e) => { e.preventDefault(); setSearch(searchInput.trim()); }}
            className="flex items-center gap-2 flex-1"
          >
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <Input
                placeholder={t('admin.bookings.searchPlaceholder')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 pr-8 h-9 text-xs bg-slate-50 border-slate-200 focus-visible:ring-emerald-600/20 rounded-lg shadow-none"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <Button
              type="submit"
              size="sm"
              className="h-9 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-none shrink-0"
            >
              {t('admin.bookings.find')}
            </Button>
            {isFiltered && (
              <button
                type="button"
                onClick={handleReset}
                title={t('admin.bookings.reset')}
                className="h-9 w-9 grid place-items-center border border-slate-200 rounded-lg text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors shrink-0"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
          </form>

          {data && (
            <p className="text-[11px] text-slate-400 font-medium shrink-0 select-none">
              <span className="font-bold text-slate-700 tabular-nums">{total}</span> {t('admin.bookings.countSuffix')}
            </p>
          )}
        </div>

        {/* Status filters — wrapping chips, no overflow */}
        <div className="px-4 py-3 flex flex-wrap gap-1.5">
          {(["ALL", ...STATUS_OPTIONS] as const).map((s) => {
            const active = statusFilter === s;
            const meta = s !== "ALL" ? STATUS_META[s] : null;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all duration-150 cursor-pointer select-none ${
                  active
                    ? "bg-emerald-700 border-emerald-700 text-white shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                {meta && (
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${active ? "bg-white/70" : meta.dot}`} />
                )}
                {meta ? meta.label : t('admin.bookings.all')}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Loading Skeleton ─────────────────────────────────────── */}
      {isLoading && (
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden animate-pulse">
          <div className="divide-y divide-slate-100">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="h-12 w-12 rounded-lg bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-2/5 rounded bg-slate-100" />
                  <div className="h-3 w-1/3 rounded bg-slate-100" />
                </div>
                <div className="h-6 w-20 rounded-lg bg-slate-100 hidden sm:block" />
                <div className="h-6 w-16 rounded bg-slate-100 hidden md:block" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Empty State ──────────────────────────────────────────── */}
      {!isLoading && data && data.items.length === 0 && (
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm p-16 text-center select-none">
          <div className="mx-auto h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 grid place-items-center mb-4">
            <Mail className="h-4.5 w-4.5 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700">{t('admin.bookings.notFound')}</p>
          <p className="text-xs text-slate-400 mt-1">{t('admin.bookings.notFoundHint')}</p>
          {isFiltered && (
            <button onClick={handleReset} className="mt-4 text-xs text-emerald-700 hover:underline font-medium">
              {t('admin.bookings.resetFilters')}
            </button>
          )}
        </div>
      )}

      {/* ── Desktop Table ────────────────────────────────────────── */}
      {!isLoading && data && data.items.length > 0 && (
        <>
          {/* Table view */}
          <div className="hidden lg:block bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 w-[200px]">{t('admin.bookings.colTour')}</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('admin.bookings.colClient')}</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 w-[140px]">{t('admin.bookings.colDate')}</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 w-[100px]">{t('admin.bookings.colAmount')}</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 w-[160px]">{t('admin.bookings.colStatus')}</th>
                  <th className="px-4 py-3 w-[44px]" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((b) => {
                  const tour = b.tour;
                  const tourTitle = tour ? (tour.title[lang] ?? tour.title.ru) : "—";
                  const meta = STATUS_META[b.status]!;
                  const referrer = (b as { referrer?: { fullName: string; role: string } | null }).referrer;
                  return (
                    <tr
                      key={b.id}
                      className={`group hover:bg-slate-50/60 transition-colors duration-100 ${meta.row}`}
                    >
                      {/* Tour */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 ring-1 ring-slate-200/60">
                            {tour?.coverImage ? (
                              <Image src={tour.coverImage} alt="" fill className="object-cover" sizes="40px" />
                            ) : (
                              <div className="absolute inset-0 grid place-items-center text-slate-300">
                                <Briefcase className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 truncate max-w-[140px] leading-snug">{tourTitle}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{tour?.country ?? "—"}</p>
                          </div>
                        </div>
                      </td>

                      {/* Client */}
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-700 leading-snug">{b.contactName}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Mail className="h-2.5 w-2.5" />{b.contactEmail}
                          </span>
                        </div>
                        {referrer && (
                          <span className="mt-1 inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded">
                            <Briefcase className="h-2.5 w-2.5" />{referrer.fullName}
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 tabular-nums text-slate-500">
                        {new Date(b.createdAt).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" })}
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(b.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3.5">
                        <span className="font-bold tabular-nums text-slate-800 font-mono">
                          ${b.totalPriceUsd}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">{b.guestsCount} {t('admin.bookings.persons')}</p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold border ${meta.badge}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/${locale}/admin/bookings/${b.id}`}
                          className="h-8 w-8 grid place-items-center rounded-lg border border-slate-200 text-slate-400 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {data.items.map((b) => {
              const tour = b.tour;
              const tourTitle = tour ? (tour.title[lang] ?? tour.title.ru) : "—";
              const meta = STATUS_META[b.status]!;
              const referrer = (b as { referrer?: { fullName: string; role: string } | null }).referrer;
              return (
                <article key={b.id} className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
                  {/* Card header */}
                  <div className="flex items-start gap-3 p-4 border-b border-slate-100">
                    <div className="relative h-11 w-11 rounded-lg overflow-hidden bg-slate-100 shrink-0 ring-1 ring-slate-200/60">
                      {tour?.coverImage ? (
                        <Image src={tour.coverImage} alt="" fill className="object-cover" sizes="44px" />
                      ) : (
                        <div className="absolute inset-0 grid place-items-center text-slate-300">
                          <Briefcase className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm leading-snug truncate">{tourTitle}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{tour?.country ?? "—"}</p>
                    </div>
                    <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border ${meta.badge}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>
                  </div>

                  {/* Card body */}
                  <div className="p-4 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-600">
                      <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium">{b.contactName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{b.contactEmail}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono">{b.contactPhone}</span>
                    </div>
                    {b.roomType && (
                      <div className="flex items-center gap-2 text-slate-500">
                        <BedDouble className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{b.roomType}</span>
                      </div>
                    )}
                    {referrer && (
                      <div className="flex items-center gap-2 text-amber-700">
                        <Briefcase className="h-3.5 w-3.5 shrink-0" />
                        <span className="font-medium">{referrer.fullName}</span>
                      </div>
                    )}
                  </div>

                  {/* Card footer */}
                  <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/40">
                    <div className="flex items-center gap-3 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(b.createdAt).toLocaleDateString("ru-RU")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        {b.guestsCount} {t('admin.bookings.persons')}
                      </span>
                      <span className="font-bold text-slate-700 font-mono">${b.totalPriceUsd}</span>
                    </div>
                    <Link
                      href={`/${locale}/admin/bookings/${b.id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline"
                    >
                      {t('admin.bookings.open')} <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import * as React from "react";
import {
  Search, Mail, Phone, User, Briefcase, Calendar, DollarSign, Filter, BedDouble, ArrowRight, Layers
} from "lucide-react";
import { bookingsApi } from "@/src/shared/api/bookings-api";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import type { BookingStatus } from "@tours/types";

const STATUS_OPTIONS: BookingStatus[] = ["NEW", "DOCUMENTS_REQUESTED", "DOCUMENTS_SUBMITTED", "IN_PROGRESS", "AWAITING_PAYMENT", "PAID", "COMPLETED", "CANCELLED"];
const STATUS_META: Record<BookingStatus, { label: string; cls: string; dot: string }> = {
  NEW:                 { label: "Новая",               cls: "bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/20",           dot: "bg-sky-500" },
  DOCUMENTS_REQUESTED: { label: "Ждём документы",      cls: "bg-violet-500/10 text-violet-600 ring-1 ring-violet-500/20",  dot: "bg-violet-500" },
  DOCUMENTS_SUBMITTED: { label: "Документы загружены", cls: "bg-orange-500/10 text-orange-600 ring-1 ring-orange-500/20",  dot: "bg-orange-500" },
  IN_PROGRESS:         { label: "В работе",            cls: "bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20",     dot: "bg-amber-500" },
  AWAITING_PAYMENT:    { label: "Ожидает оплаты",      cls: "bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/20",        dot: "bg-blue-500" },
  PAID:                { label: "Оплачена",            cls: "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20", dot: "bg-emerald-500" },
  COMPLETED:           { label: "Завершена",           cls: "bg-slate-500/10 text-slate-600 ring-1 ring-slate-500/20",    dot: "bg-slate-400" },
  CANCELLED:           { label: "Отменена",            cls: "bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/20",        dot: "bg-rose-500" },
};

export function AdminBookingsList() {
  const locale = useLocale();
  const lang = locale as "ru" | "en" | "tj";
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

  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* ── Filter Bar ──────────────────────────────────────────── */}
      <div className="tv-surface-elevated p-4 bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 shrink-0 select-none">
            <Filter className="h-3.5 w-3.5 text-orange-500" />
            Статус
          </div>
          
          <div className="flex flex-wrap gap-1.5 flex-1 select-none">
            {(["ALL", ...STATUS_OPTIONS] as const).map((s) => {
              const active = statusFilter === s;
              const meta = s !== "ALL" ? STATUS_META[s] : null;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? "bg-slate-900 text-white shadow-sm border border-slate-900 scale-103"
                      : "bg-slate-50 border border-slate-200/60 text-slate-600 hover:bg-white hover:border-slate-300"
                  }`}
                >
                  {meta && <span className={`h-1.5 w-1.5 rounded-full ${meta.dot} ${active ? "animate-pulse" : ""}`} />}
                  {meta ? meta.label : "Все"}
                </button>
              );
            })}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); setSearch(searchInput.trim()); }}
            className="flex gap-2 lg:ml-auto lg:max-w-xs w-full lg:w-auto"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Имя, email, телефон…"
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

      {/* ── Count Header ────────────────────────────────────────── */}
      {data && (
        <div className="flex items-center justify-between select-none">
          <p className="text-xs text-slate-400 font-semibold bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/40">
            Найдено: <strong className="text-slate-800 tabular-nums">{total}</strong> заявок
          </p>
        </div>
      )}

      {/* ── Loading Skeleton ────────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="tv-surface p-5 bg-white border border-slate-200/50 animate-pulse rounded-2xl">
              <div className="flex gap-5 flex-col md:flex-row">
                <div className="w-full md:w-32 h-32 rounded-xl bg-slate-100" />
                <div className="flex-1 space-y-3 py-2">
                  <div className="h-5 w-2/5 rounded bg-slate-100" />
                  <div className="h-4 w-1/3 rounded bg-slate-100" />
                  <div className="h-4 w-3/4 rounded bg-slate-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty State ─────────────────────────────────────────── */}
      {data && data.items.length === 0 && (
        <div className="tv-surface-elevated p-16 text-center text-slate-400 bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-2xl select-none">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-slate-50 border border-slate-200/40 grid place-items-center text-slate-400">
            <Mail className="h-5 w-5 text-orange-500" />
          </div>
          <p className="mt-4 font-bold text-slate-800">Заявок не найдено</p>
          <p className="text-xs text-slate-400 mt-1">Измените критерии поиска или выберите другой статус.</p>
        </div>
      )}

      {/* ── Bookings Grid/Cards ─────────────────────────────────── */}
      <div className="space-y-4">
        {data?.items.map((b) => {
          const tour = b.tour;
          const tourTitle = tour ? (tour.title[lang] ?? tour.title.ru) : "—";
          const meta = STATUS_META[b.status]!;
          const referrer = (b as { referrer?: { id: string; email: string; fullName: string; role: string } | null }).referrer;
          return (
            <article
              key={b.id}
              className="tv-surface-elevated p-5 md:p-6 bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:-translate-y-0.5 hover:shadow-md duration-200 group select-none relative overflow-hidden"
            >
              <div className="flex flex-col md:flex-row md:items-start gap-5">
                {/* Image Block */}
                <div className="relative w-full md:w-36 aspect-video md:aspect-square rounded-2xl overflow-hidden bg-slate-100 shrink-0 ring-1 ring-slate-200/40 group-hover:scale-101 duration-300">
                  {tour?.coverImage ? (
                    <Image src={tour.coverImage} alt="" fill className="object-cover group-hover:scale-105 duration-500" sizes="144px" />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-slate-400 text-xs">Без обложки</div>
                  )}
                  {/* Status Overlay tag */}
                  <Link
                    href={`/${locale}/admin/bookings/${b.id}`}
                    className={`absolute top-3 left-3 tv-chip ${meta.cls} hover:scale-103 duration-150 shadow-sm`}
                    title="Открыть рабочее пространство"
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${meta.dot} animate-pulse-subtle`} />
                    {meta.label}
                  </Link>
                </div>

                {/* Content Block */}
                <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                  <div>
                    {/* Header: Title */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-slate-800 group-hover:text-orange-600 duration-150 leading-tight text-base truncate max-w-[400px]">
                          {tourTitle}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 font-semibold flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                          {tour?.country ?? "Страна не указана"}
                        </p>
                      </div>
                    </div>

                    {/* Traveller Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 mt-4 text-xs font-semibold select-all">
                      <div className="flex items-center gap-2.5 text-slate-600">
                        <span className="grid place-items-center h-7 w-7 rounded-lg bg-slate-50 border border-slate-200/40 text-slate-400 shrink-0"><User className="w-3.5 h-3.5" /></span>
                        <span className="truncate text-slate-800">{b.contactName}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-slate-600">
                        <span className="grid place-items-center h-7 w-7 rounded-lg bg-slate-50 border border-slate-200/40 text-slate-400 shrink-0"><Mail className="w-3.5 h-3.5" /></span>
                        <span className="truncate text-slate-800">{b.contactEmail}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-slate-600">
                        <span className="grid place-items-center h-7 w-7 rounded-lg bg-slate-50 border border-slate-200/40 text-slate-400 shrink-0"><Phone className="w-3.5 h-3.5" /></span>
                        <span className="truncate text-slate-800 font-mono">{b.contactPhone}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-slate-600">
                        <span className="grid place-items-center h-7 w-7 rounded-lg bg-slate-50 border border-slate-200/40 text-slate-400 shrink-0"><Layers className="w-3.5 h-3.5" /></span>
                        <span className="flex items-center gap-1.5 text-slate-800">
                          {b.guestsCount} чел. · 
                          <span className="inline-flex items-center font-extrabold text-emerald-600 font-mono bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                            ${b.totalPriceUsd}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Metadata Badges Capsule */}
                    <div className="flex flex-wrap gap-2 mt-4 select-none">
                      {b.roomType && (
                        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-xl bg-orange-500/10 text-orange-700 border border-orange-500/15">
                          <BedDouble className="w-3.5 h-3.5" />
                          Размещение: {b.roomType}
                        </div>
                      )}
                      {referrer && (
                        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 border border-amber-500/15">
                          <Briefcase className="w-3.5 h-3.5" />
                          Реферер: <strong className="text-amber-800">{referrer.fullName}</strong>
                          <span className="opacity-40">·</span>
                          <span className="uppercase tracking-wider text-[9px]">{referrer.role}</span>
                        </div>
                      )}
                    </div>

                    {/* Guest comments notes */}
                    {b.notes && (
                      <div className="mt-4 p-3 rounded-xl bg-slate-50 border-l-3 border-orange-500/50 text-xs text-slate-600 italic leading-relaxed">
                        «{b.notes}»
                      </div>
                    )}
                  </div>

                  {/* Booking Workspace Footer */}
                  <div className="flex items-center justify-between flex-wrap gap-3 pt-4 mt-4 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      Заявка от {new Date(b.createdAt).toLocaleString("ru-RU")}
                    </span>
                    
                    <Link
                      href={`/${locale}/admin/bookings/${b.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-orange-700 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/15 hover:border-orange-500/25 transition-all duration-200 hover:scale-102 cursor-pointer shadow-3xs"
                    >
                      Открыть карточку
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

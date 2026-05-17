"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  Search, Mail, Phone, User, Briefcase, Calendar, DollarSign, Filter, BedDouble, ArrowRight,
} from "lucide-react";
import { bookingsApi } from "@/src/shared/api/bookings-api";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import type { BookingStatus } from "@tours/types";

const STATUS_OPTIONS: BookingStatus[] = ["NEW", "DOCUMENTS_REQUESTED", "DOCUMENTS_SUBMITTED", "IN_PROGRESS", "AWAITING_PAYMENT", "PAID", "COMPLETED", "CANCELLED"];
const STATUS_META: Record<BookingStatus, { label: string; cls: string; dot: string }> = {
  NEW:                 { label: "Новая",               cls: "bg-sky-50 text-sky-700 ring-1 ring-sky-100",           dot: "bg-sky-500" },
  DOCUMENTS_REQUESTED: { label: "Ждём документы",      cls: "bg-violet-50 text-violet-700 ring-1 ring-violet-100",  dot: "bg-violet-500" },
  DOCUMENTS_SUBMITTED: { label: "Документы загружены", cls: "bg-orange-50 text-orange-700 ring-1 ring-orange-100",  dot: "bg-orange-500" },
  IN_PROGRESS:         { label: "В работе",            cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",     dot: "bg-amber-500" },
  AWAITING_PAYMENT:    { label: "Ожидает оплаты",      cls: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",        dot: "bg-blue-500" },
  PAID:                { label: "Оплачена",            cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100", dot: "bg-emerald-500" },
  COMPLETED:           { label: "Завершена",           cls: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",    dot: "bg-slate-500" },
  CANCELLED:           { label: "Отменена",            cls: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",        dot: "bg-rose-500" },
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

  const total = data?.items.length ?? 0;

  return (
    <>
      {/* Filter bar */}
      <div className="tv-surface-elevated p-4 mb-5">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 shrink-0">
            <Filter className="h-3.5 w-3.5" />
            Статус
          </div>
          <div className="flex flex-wrap gap-1.5 flex-1">
            {(["ALL", ...STATUS_OPTIONS] as const).map((s) => {
              const active = statusFilter === s;
              const meta = s !== "ALL" ? STATUS_META[s] : null;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    active
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300"
                  }`}
                >
                  {meta && <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />}
                  {meta ? meta.label : "Все"}
                </button>
              );
            })}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); setSearch(searchInput.trim()); }}
            className="flex gap-2 md:ml-auto md:max-w-xs w-full md:w-auto"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Имя, email, телефон…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="outline" size="icon">
              <Search className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Counter */}
      {data && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Найдено: <strong className="text-slate-900 tabular-nums">{total}</strong>
          </p>
        </div>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="tv-surface p-4 animate-pulse">
              <div className="flex gap-4">
                <div className="w-32 h-32 rounded-xl bg-slate-100" />
                <div className="flex-1 space-y-2 py-2">
                  <div className="h-4 w-2/5 rounded bg-slate-100" />
                  <div className="h-3 w-1/3 rounded bg-slate-100" />
                  <div className="h-3 w-3/4 rounded bg-slate-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="tv-surface-elevated p-12 text-center text-slate-500">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-slate-100 grid place-items-center text-slate-400">
            <Mail className="h-6 w-6" />
          </div>
          <p className="mt-4 font-semibold text-slate-900">Заявок не найдено</p>
          <p className="text-sm">Измените фильтры или сбросьте поиск.</p>
        </div>
      )}

      <div className="space-y-3">
        {data?.items.map((b) => {
          const tour = b.tour;
          const tourTitle = tour ? (tour.title[lang] ?? tour.title.ru) : "—";
          const meta = STATUS_META[b.status]!;
          const referrer = (b as { referrer?: { id: string; email: string; fullName: string; role: string } | null }).referrer;
          return (
            <article key={b.id} className="tv-surface p-4 md:p-5">
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                <div className="relative w-full md:w-36 aspect-video md:aspect-square rounded-xl overflow-hidden bg-slate-100 shrink-0 ring-1 ring-slate-200/70">
                  {tour?.coverImage ? (
                    <Image src={tour.coverImage} alt="" fill className="object-cover" sizes="144px" />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-slate-400 text-xs">Без фото</div>
                  )}
                  <Link
                    href={`/${locale}/admin/bookings/${b.id}`}
                    className={`absolute top-2 left-2 tv-chip ${meta.cls} hover:ring-2 transition-shadow`}
                    title="Открыть рабочее пространство"
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </Link>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 leading-tight">{tourTitle}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">{tour?.country}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5 text-sm mt-3">
                    <div className="flex items-center gap-2 text-slate-700">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium">{b.contactName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{b.contactEmail}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{b.contactPhone}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-700">
                      <span className="flex items-center gap-1"><User className="h-3.5 w-3.5 text-slate-400" />{b.guestsCount}</span>
                      <span className="flex items-center gap-1 font-semibold text-emerald-700">
                        <DollarSign className="h-3.5 w-3.5" />
                        {b.totalPriceUsd}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {b.roomType && (
                      <div className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 ring-1 ring-teal-100">
                        <BedDouble className="w-3 h-3" />
                        {b.roomType}
                      </div>
                    )}
                    {referrer && (
                      <div className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 ring-1 ring-amber-100">
                        <Briefcase className="w-3 h-3" />
                        Реферер: <strong>{referrer.fullName}</strong>
                        <span className="text-amber-600">·</span>
                        <span>{referrer.role}</span>
                      </div>
                    )}
                  </div>

                  {b.notes && (
                    <p className="text-sm text-slate-600 italic mt-2 px-3 py-2 rounded-lg bg-slate-50 border-l-2 border-slate-300">
                      «{b.notes}»
                    </p>
                  )}

                  <div className="flex items-center justify-between flex-wrap gap-2 pt-3 mt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-400 inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(b.createdAt).toLocaleString("ru-RU")}
                    </span>
                    <Link
                      href={`/${locale}/admin/bookings/${b.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-teal-700 bg-teal-50 border border-teal-100 hover:bg-teal-100 transition-colors"
                    >
                      Открыть
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

    </>
  );
}

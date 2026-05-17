"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { MapPin, Users, Calendar, ArrowRight, Compass, Plane } from "lucide-react";
import { bookingsApi } from "@/src/shared/api/bookings-api";
import type { BookingStatus } from "@tours/types";
import { Button } from "@/src/components/ui/button";

const STATUS_META: Record<BookingStatus, { label: string; cls: string; dot: string }> = {
  NEW:                  { label: "Новая",               cls: "bg-sky-50 text-sky-700 ring-1 ring-sky-100",              dot: "bg-sky-500" },
  DOCUMENTS_REQUESTED:  { label: "Нужны документы",     cls: "bg-violet-50 text-violet-700 ring-1 ring-violet-100",    dot: "bg-violet-500" },
  DOCUMENTS_SUBMITTED:  { label: "На проверке",          cls: "bg-orange-50 text-orange-700 ring-1 ring-orange-100",   dot: "bg-orange-500" },
  IN_PROGRESS:          { label: "В работе",             cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",       dot: "bg-amber-500" },
  AWAITING_PAYMENT:     { label: "Ожидает оплаты",      cls: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",             dot: "bg-sky-500" },
  PAID:                 { label: "Оплачена",             cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100", dot: "bg-emerald-500" },
  COMPLETED:            { label: "Завершена",            cls: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",      dot: "bg-slate-500" },
  CANCELLED:            { label: "Отменена",             cls: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",          dot: "bg-rose-500" },
};

export function TripsList() {
  const locale = useLocale();
  const lang = locale as "ru" | "en" | "tj";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["bookings", "my"],
    queryFn: () => bookingsApi.listMy({ pageSize: 50 }),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="tv-surface p-4 flex gap-4 animate-pulse">
            <div className="w-28 h-28 rounded-xl bg-slate-100" />
            <div className="flex-1 space-y-2 py-2">
              <div className="h-4 w-3/5 rounded bg-slate-100" />
              <div className="h-3 w-2/5 rounded bg-slate-100" />
              <div className="h-3 w-1/3 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="tv-surface p-8 text-center text-rose-600">
        Не удалось загрузить заявки. Попробуйте обновить страницу.
      </div>
    );
  }
  if (data.items.length === 0) {
    return (
      <div className="tv-surface-elevated p-12 text-center">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-linear-to-br from-teal-500 to-sky-600 grid place-items-center text-white shadow-[0_10px_24px_-8px_rgba(13,148,136,0.55)]">
          <Compass className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-slate-900">Пока ни одной поездки</h3>
        <p className="mt-1 text-slate-500 max-w-md mx-auto">
          Начните с каталога — там собраны лучшие направления и сезонные предложения.
        </p>
        <Link href={`/${locale}/tours`} className="inline-block mt-5">
          <Button size="lg">
            <Plane className="h-4 w-4" />
            Перейти к каталогу туров
          </Button>
        </Link>
      </div>
    );
  }

  const order: Record<BookingStatus, number> = {
    AWAITING_PAYMENT: 0, DOCUMENTS_REQUESTED: 1, DOCUMENTS_SUBMITTED: 2, IN_PROGRESS: 3, NEW: 4, PAID: 5, COMPLETED: 6, CANCELLED: 7,
  };
  const ordered = [...data.items].sort(
    (a, b) => (order[a.status] ?? 99) - (order[b.status] ?? 99),
  );

  return (
    <div className="flex flex-col gap-3.5">
      {ordered.map((b) => {
        const tour = b.tour;
        const tourTitle = tour ? (tour.title[lang] ?? tour.title.ru ?? tour.slug) : "—";
        const statusInfo = STATUS_META[b.status]!;
        return (
          <article
            key={b.id}
            className="group tv-surface p-4 sm:p-5 flex flex-col sm:flex-row gap-4 hover:border-teal-200 hover:shadow-[0_10px_30px_-12px_rgba(13,148,136,0.25)] transition-all"
          >
            <div className="relative w-full sm:w-32 sm:h-32 aspect-video sm:aspect-square rounded-xl overflow-hidden shrink-0 bg-slate-100 ring-1 ring-slate-200/70">
              {tour?.coverImage ? (
                <Image
                  src={tour.coverImage}
                  alt={tourTitle}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(min-width: 640px) 128px, 100vw"
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-slate-400">
                  <Compass className="h-6 w-6" />
                </div>
              )}
              <div className="absolute top-2 left-2">
                <span className={`tv-chip ${statusInfo.cls}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
                  {statusInfo.label}
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-semibold text-slate-900 leading-tight line-clamp-2 group-hover:text-teal-700 transition-colors">
                  {tour ? (
                    <Link href={`/${locale}/tours/${tour.slug}`} className="focus:outline-none">
                      {tourTitle}
                    </Link>
                  ) : (
                    tourTitle
                  )}
                </h3>
              </div>

              {tour?.country && (
                <p className="text-sm text-slate-500 flex items-center gap-1 mb-3">
                  <MapPin className="h-3.5 w-3.5 text-teal-600" />
                  {tour.country}
                </p>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  <span>Гостей: <strong className="text-slate-900">{b.guestsCount}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>{new Date(b.createdAt).toLocaleDateString("ru-RU")}</span>
                </div>
                <div className="text-slate-600 flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal-500" />
                  <span>Сумма: <strong className="text-slate-900 tabular-nums">${b.totalPriceUsd}</strong></span>
                </div>
              </div>

              <div className="mt-auto pt-3 flex flex-wrap items-center gap-3">
                <Link
                  href={`/${locale}/dashboard/trips/${b.id}`}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-800"
                >
                  Открыть заявку
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
                {tour && (
                  <Link
                    href={`/${locale}/tours/${tour.slug}`}
                    className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600"
                  >
                    О туре
                  </Link>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

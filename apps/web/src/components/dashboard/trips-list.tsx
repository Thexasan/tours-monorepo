"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { MapPin, Users, Calendar, ArrowRight, Compass, Plane, Download } from "lucide-react";
import { bookingsApi } from "@/src/shared/api/bookings-api";
import type { BookingStatus } from "@tours/types";
import { Button } from "@/src/components/ui/button";
import { toast } from "sonner";

async function triggerPdfDownload(bookingId: string) {
  const blob = await bookingsApi.downloadTicket(bookingId);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ticket-${bookingId.slice(0, 8).toUpperCase()}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


function DownloadTicketButton({ bookingId }: { bookingId: string }) {
  const [loading, setLoading] = useState(false);
  const t = useTranslations('dashboard');

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      await triggerPdfDownload(bookingId);
    } catch {
      toast.error(t('client.trips.ticketError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700 px-3.5 py-2 rounded-xl transition-all duration-300 disabled:opacity-60 shadow-sm hover:shadow active:scale-95 shrink-0"
    >
      <Download className="h-3.5 w-3.5" />
      <span>{loading ? t('client.trips.downloading') : t('client.trips.downloadTicket')}</span>
    </button>
  );
}

export function TripsList({ basePath = "dashboard" }: { basePath?: string }) {
  const locale = useLocale();
  const t = useTranslations('dashboard');
  const lang = locale as "ru" | "en" | "tr";

  const STATUS_META: Record<BookingStatus, { label: string; cls: string; dot: string }> = {
    NEW:                  { label: t('client.trips.statusNew'),         cls: "bg-sky-50/90 text-sky-700 border-sky-100",              dot: "bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.4)]" },
    DOCUMENTS_REQUESTED:  { label: t('client.trips.statusDocsNeeded'), cls: "bg-violet-50/90 text-violet-700 border-violet-100 animate-pulse",    dot: "bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.4)]" },
    DOCUMENTS_SUBMITTED:  { label: t('client.trips.statusDocsReview'), cls: "bg-teal-50/90 text-teal-700 border-teal-100",   dot: "bg-teal-500 shadow-[0_0_8px_rgba(13,148,136,0.4)]" },
    IN_PROGRESS:          { label: t('client.trips.statusInProgress'),  cls: "bg-amber-50/90 text-amber-700 border-amber-100",       dot: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" },
    AWAITING_PAYMENT:     { label: t('client.trips.statusPayment'),     cls: "bg-rose-50/95 text-rose-700 border-rose-200 animate-pulse",             dot: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" },
    PAID:                 { label: t('client.trips.statusPaid'),        cls: "bg-emerald-50/90 text-emerald-700 border-emerald-100", dot: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" },
    COMPLETED:            { label: t('client.trips.statusCompleted'),   cls: "bg-slate-100/90 text-slate-700 border-slate-200",      dot: "bg-slate-500" },
    CANCELLED:            { label: t('client.trips.statusCancelled'),   cls: "bg-rose-50/90 text-rose-700 border-rose-100",          dot: "bg-rose-500" },
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["bookings", "my"],
    queryFn: () => bookingsApi.listMy({ pageSize: 50 }),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="tv-surface p-5 flex gap-4 animate-pulse rounded-2xl">
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
      <div className="tv-surface p-8 text-center text-rose-600 rounded-2xl">
        {t('client.trips.loadError')}
      </div>
    );
  }
  if (data.items.length === 0) {
    return (
      <div className="tv-surface-elevated p-12 text-center rounded-3xl border border-slate-100 shadow-lg bg-gradient-to-b from-white to-slate-50/20 max-w-xl mx-auto my-8">
        <div className="mx-auto h-20 w-20 rounded-3xl bg-gradient-to-tr from-teal-500 to-emerald-500 grid place-items-center text-white shadow-[0_12px_28px_-6px_rgba(13,148,136,0.45)] mb-6 animate-pulse">
          <Compass className="h-9 w-9 text-white animate-spin-slow" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">{t('client.trips.noTrips')}</h3>
        <p className="mt-2 text-sm text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">
          {t('client.trips.noTripsHint')}
        </p>
        <Link href={`/${locale}/tours`} className="inline-block mt-6">
          <Button size="lg" className="rounded-2xl font-bold text-sm bg-teal-600 hover:bg-teal-700 shadow-md hover:shadow-lg transition-all duration-300">
            <Plane className="h-4.5 w-4.5 mr-1" />
            {t('client.trips.toCatalog')}
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
    <div className="flex flex-col gap-4">
      {ordered.map((b) => {
        const tour = b.tour;
        const tourTitle = tour ? (tour.title[lang] ?? tour.title.ru ?? tour.slug) : "—";
        const statusInfo = STATUS_META[b.status]!;
        return (
          <article
            key={b.id}
            className="group relative overflow-hidden tv-surface p-5 flex flex-col sm:flex-row gap-5 rounded-3xl border border-slate-100/80 shadow-sm bg-white hover:border-teal-500/30 hover:shadow-[0_12px_32px_-8px_rgba(13,148,136,0.12)] hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="relative w-full sm:w-36 sm:h-36 aspect-video sm:aspect-square rounded-2xl overflow-hidden shrink-0 bg-slate-50 border border-slate-100 shadow-inner">
              {tour?.coverImage ? (
                <Image
                  src={tour.coverImage}
                  alt={tourTitle}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(min-width: 640px) 144px, 100vw"
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-slate-400">
                  <Compass className="h-6 w-6" />
                </div>
              )}
              <div className="absolute top-2.5 left-2.5 z-10">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md bg-white/95 border shadow-sm ${statusInfo.cls}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
                  {statusInfo.label}
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h3 className="text-base font-bold text-slate-800 leading-snug line-clamp-2 group-hover:text-teal-600 transition-colors">
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
                <p className="text-xs font-semibold text-slate-400 flex items-center gap-1 mb-4">
                  <MapPin className="h-3.5 w-3.5 text-teal-600" />
                  <span>{tour.country}</span>
                </p>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs border-t border-slate-50 pt-3">
                <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                  <Users className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>{t('client.trips.guests')} <strong className="text-slate-800 font-bold">{b.guestsCount}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                  <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>{new Date(b.createdAt).toLocaleDateString("ru-RU")}</span>
                </div>
                <div className="text-slate-500 font-medium flex items-center gap-1.5 col-span-2 sm:col-span-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal-500 shrink-0 shadow-[0_0_6px_rgba(13,148,136,0.6)]" />
                  <span>{t('client.trips.total')} <strong className="text-slate-800 font-extrabold tabular-nums">${b.totalPriceUsd}</strong></span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100/60 flex flex-wrap items-center gap-2.5">
                <Link
                  href={`/${locale}/${basePath}/trips/${b.id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 bg-teal-50 hover:bg-teal-100 hover:text-teal-700 px-3.5 py-2 rounded-xl transition-all duration-300 shadow-sm hover:shadow active:scale-95"
                >
                  <span>{t('client.trips.openDetails')}</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
                {(b.status === "PAID" || b.status === "COMPLETED") && (
                  <DownloadTicketButton bookingId={b.id} />
                )}
                {tour && (
                  <Link
                    href={`/${locale}/tours/${tour.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-600 px-3 py-2 rounded-xl hover:bg-slate-50 transition-all duration-300"
                  >
                    {t('client.trips.aboutTour')}
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

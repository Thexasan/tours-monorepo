"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { bookingsApi } from "@/src/shared/api/bookings-api";
import type { BookingStatus } from "@tours/types";

const STATUS_LABELS: Record<BookingStatus, { label: string; cls: string }> = {
  NEW: { label: "Новая", cls: "bg-blue-100 text-blue-700" },
  IN_PROGRESS: { label: "В работе", cls: "bg-amber-100 text-amber-700" },
  PAID: { label: "Оплачена", cls: "bg-emerald-100 text-emerald-700" },
  COMPLETED: { label: "Завершена", cls: "bg-zinc-200 text-zinc-700" },
  CANCELLED: { label: "Отменена", cls: "bg-red-100 text-red-700" },
};

export function TripsList() {
  const locale = useLocale();
  const lang = locale as "ru" | "en" | "tj";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["bookings", "my"],
    queryFn: () => bookingsApi.listMy({ pageSize: 50 }),
  });

  if (isLoading) {
    return <div className="text-zinc-500">Загрузка...</div>;
  }
  if (isError || !data) {
    return <div className="text-red-600">Не удалось загрузить заявки.</div>;
  }
  if (data.items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
        <p className="text-zinc-500 mb-4">У вас пока нет заявок.</p>
        <Link href={`/${locale}/tours`} className="text-blue-600 hover:underline">
          Перейти к каталогу туров →
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {data.items.map((b) => {
        const tour = b.tour;
        const tourTitle = tour ? (tour.title[lang] ?? tour.title.ru) : "—";
        const statusInfo = STATUS_LABELS[b.status];
        return (
          <div key={b.id} className="bg-white rounded-xl border border-zinc-200 p-4 flex gap-4">
            {tour?.coverImage && (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0 bg-zinc-100">
                <Image src={tour.coverImage} alt={tourTitle} fill className="object-cover" sizes="96px" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-semibold text-zinc-900 line-clamp-1">
                  {tour ? (
                    <Link href={`/${locale}/tours/${tour.slug}`} className="hover:text-blue-600">
                      {tourTitle}
                    </Link>
                  ) : tourTitle}
                </h3>
                <span className={`text-xs font-medium px-2 py-1 rounded ${statusInfo.cls} shrink-0`}>
                  {statusInfo.label}
                </span>
              </div>
              <p className="text-sm text-zinc-600">{tour?.country}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-zinc-500">
                <span>Гостей: {b.guestsCount}</span>
                <span>Сумма: ${b.totalPriceUsd}</span>
                <span>{new Date(b.createdAt).toLocaleDateString("ru-RU")}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

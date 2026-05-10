"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useLocale } from "next-intl";
import { Search, Mail, Phone, User, Briefcase } from "lucide-react";
import { bookingsApi } from "@/src/shared/api/bookings-api";
import { extractErrorMessage } from "@/src/shared/api/apiClient";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import type { BookingStatus } from "@tours/types";

const STATUS_OPTIONS: BookingStatus[] = ["NEW", "IN_PROGRESS", "PAID", "COMPLETED", "CANCELLED"];
const STATUS_META: Record<BookingStatus, { label: string; cls: string }> = {
  NEW:         { label: "Новая",       cls: "bg-blue-100 text-blue-700" },
  IN_PROGRESS: { label: "В работе",    cls: "bg-amber-100 text-amber-700" },
  PAID:        { label: "Оплачена",    cls: "bg-emerald-100 text-emerald-700" },
  COMPLETED:   { label: "Завершена",   cls: "bg-zinc-200 text-zinc-700" },
  CANCELLED:   { label: "Отменена",    cls: "bg-red-100 text-red-700" },
};

export function AdminBookingsList() {
  const qc = useQueryClient();
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

  const updateStatusM = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatus }) =>
      bookingsApi.updateStatus(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "bookings"] }),
  });

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
        <div className="flex flex-wrap gap-1">
          {(["ALL", ...STATUS_OPTIONS] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                statusFilter === s
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {s === "ALL" ? "Все" : STATUS_META[s].label}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); setSearch(searchInput.trim()); }}
          className="flex gap-2 md:ml-auto md:max-w-sm"
        >
          <Input
            placeholder="Поиск по имени, email или телефону"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Button type="submit" variant="outline" size="icon">
            <Search className="w-4 h-4" />
          </Button>
        </form>
      </div>

      {isLoading && <p className="text-zinc-500">Загрузка...</p>}

      {data && data.items.length === 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center text-zinc-500">
          Заявок не найдено.
        </div>
      )}

      <div className="space-y-3">
        {data?.items.map((b) => {
          const tour = b.tour;
          const tourTitle = tour ? (tour.title[lang] ?? tour.title.ru) : "—";
          const meta = STATUS_META[b.status];
          const referrer = (b as { referrer?: { id: string; email: string; fullName: string; role: string } | null }).referrer;
          return (
            <div key={b.id} className="bg-white rounded-xl border border-zinc-200 p-4">
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                {tour?.coverImage && (
                  <div className="relative w-full md:w-32 aspect-video md:aspect-square rounded-lg overflow-hidden bg-zinc-100 shrink-0">
                    <Image src={tour.coverImage} alt="" fill className="object-cover" sizes="128px" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-zinc-900">{tourTitle}</h3>
                    <span className={`text-xs font-medium px-2 py-1 rounded shrink-0 ${meta.cls}`}>
                      {meta.label}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 mb-2">{tour?.country}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm text-zinc-700 mb-3">
                    <div className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-zinc-400" />{b.contactName}</div>
                    <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-zinc-400" />{b.contactEmail}</div>
                    <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-zinc-400" />{b.contactPhone}</div>
                    <div className="text-zinc-500">
                      Гостей: {b.guestsCount} • Сумма: <strong className="text-zinc-900">${b.totalPriceUsd}</strong>
                    </div>
                  </div>

                  {referrer && (
                    <div className="text-xs text-zinc-500 mb-2 flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      Реферер: {referrer.fullName} ({referrer.role})
                    </div>
                  )}

                  {b.notes && (
                    <p className="text-sm text-zinc-600 italic mb-2">«{b.notes}»</p>
                  )}

                  <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-zinc-100">
                    <span className="text-xs text-zinc-400">
                      Создана {new Date(b.createdAt).toLocaleString("ru-RU")}
                    </span>
                    <div className="flex items-center gap-2">
                      <select
                        defaultValue={b.status}
                        onChange={(e) => {
                          const newStatus = e.target.value as BookingStatus;
                          if (newStatus !== b.status &&
                              confirm(`Сменить статус "${meta.label}" → "${STATUS_META[newStatus].label}"?` +
                                     (newStatus === "PAID" ? "\n\n⚡ Это запустит триггер начисления вознаграждения!" : ""))) {
                            updateStatusM.mutate({ id: b.id, status: newStatus });
                          } else {
                            (e.target as HTMLSelectElement).value = b.status;
                          }
                        }}
                        className="h-9 rounded-md border border-zinc-200 px-3 text-sm bg-white"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{STATUS_META[s].label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {updateStatusM.isError && (
        <div className="mt-3 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {extractErrorMessage(updateStatusM.error)}
        </div>
      )}
      {updateStatusM.isSuccess && (
        <div className="fixed bottom-4 right-4 rounded-md bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 shadow-md">
          ✓ Статус обновлён
        </div>
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Check, X } from "lucide-react";
import { useLocale } from "next-intl";
import { reviewsApi } from "@/src/shared/api/reviews-api";
import { extractErrorMessage } from "@/src/shared/api/apiClient";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";

const STATUS_FILTERS = [
  { value: "PENDING", label: "На модерации" },
  { value: "APPROVED", label: "Опубликованы" },
  { value: "REJECTED", label: "Отклонены" },
] as const;

export function AdminModerationList() {
  const qc = useQueryClient();
  const locale = useLocale();
  const lang = locale as "ru" | "en" | "tj";
  const [filter, setFilter] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [rejecting, setRejecting] = useState<{ id: string; reason: string } | null>(null);

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["admin", "reviews", filter],
    queryFn: () => reviewsApi.listAdmin(filter),
  });

  const approveM = useMutation({
    mutationFn: (id: string) => reviewsApi.moderate(id, "APPROVE"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reviews"] });
      toast.success("Отзыв опубликован");
    },
    onError: (e) => toast.error("Не удалось опубликовать отзыв", { description: extractErrorMessage(e) }),
  });
  const rejectM = useMutation({
    mutationFn: (vars: { id: string; reason: string }) => reviewsApi.moderate(vars.id, "REJECT", vars.reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reviews"] });
      setRejecting(null);
      toast.success("Отзыв отклонён");
    },
    onError: (e) => toast.error("Не удалось отклонить отзыв", { description: extractErrorMessage(e) }),
  });

  return (
    <>
      <div className="flex gap-2 mb-4">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value} type="button"
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              filter === f.value
                ? "bg-blue-600 text-white"
                : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-zinc-500">Загрузка…</p>}

      {reviews && reviews.length === 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center text-zinc-500">
          Отзывов в этом статусе нет.
        </div>
      )}

      <div className="space-y-4">
        {reviews?.map((r) => {
          const tourTitle = r.tour ? (r.tour.title[lang] ?? r.tour.title.ru) : "—";
          return (
            <div key={r.id} className="bg-white rounded-xl border border-zinc-200 p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-zinc-900">{r.author.fullName}</h3>
                    <span className="text-xs text-zinc-500">({r.userEmail})</span>
                  </div>
                  <p className="text-sm text-zinc-500 mt-0.5">{tourTitle}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-zinc-300"}`} />
                    ))}
                  </div>
                </div>
                <span className="text-xs text-zinc-400">
                  {new Date(r.createdAt).toLocaleString("ru-RU")}
                </span>
              </div>

              <div className="bg-zinc-50 rounded-md p-3 text-sm text-zinc-700 mb-3 whitespace-pre-line">
                {r.text}
              </div>

              {r.photos.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {r.photos.map((url, i) => (
                    <div key={i} className="relative w-24 h-24 rounded-md overflow-hidden bg-zinc-100">
                      <Image src={url} alt="" fill className="object-cover" sizes="96px" />
                    </div>
                  ))}
                </div>
              )}

              {r.status === "PENDING" && (
                <>
                  {rejecting?.id === r.id ? (
                    <div className="space-y-2 mt-3 pt-3 border-t border-zinc-100">
                      <textarea
                        value={rejecting.reason}
                        onChange={(e) => setRejecting({ ...rejecting, reason: e.target.value })}
                        placeholder="Причина отклонения…"
                        rows={2}
                        className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
                      />
                      <div className="flex gap-2">
                        <Button variant="destructive"
                          onClick={() => rejectM.mutate({ id: r.id, reason: rejecting.reason })}
                          disabled={rejectM.isPending || !rejecting.reason.trim()}>
                          Отклонить
                        </Button>
                        <Button variant="outline" onClick={() => setRejecting(null)}>Отмена</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-100">
                      <Button onClick={() => approveM.mutate(r.id)} disabled={approveM.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700">
                        <Check className="w-4 h-4 mr-1" /> Опубликовать
                      </Button>
                      <Button variant="outline" onClick={() => setRejecting({ id: r.id, reason: "" })}>
                        <X className="w-4 h-4 mr-1" /> Отклонить
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

    </>
  );
}

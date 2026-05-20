"use client";

import { useState } from "react";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Check, X, Calendar, Compass, MessageSquareOff, RefreshCw, Sparkles } from "lucide-react";
import { useLocale } from "next-intl";
import { reviewsApi } from "@/src/shared/api/reviews-api";
import { extractErrorMessage } from "@/src/shared/api/apiClient";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";

const STATUS_FILTERS = [
  { value: "PENDING", label: "На модерации", color: "indigo" },
  { value: "APPROVED", label: "Опубликованы", color: "emerald" },
  { value: "REJECTED", label: "Отклонены", color: "rose" },
] as const;

export function AdminModerationList() {
  const qc = useQueryClient();
  const locale = useLocale();
  const lang = locale as "ru" | "en" | "tr";
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

  // Generate initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // Helper for generating deterministic premium gradients based on author name
  const getGradient = (name: string) => {
    const gradients = [
      "from-indigo-500 to-purple-500",
      "from-blue-500 to-indigo-600",
      "from-violet-600 to-fuchsia-500",
      "from-emerald-500 to-teal-600",
      "from-rose-500 to-orange-500",
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) {
      sum += name.charCodeAt(i);
    }
    return gradients[sum % gradients.length];
  };

  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* ── Toolbar & Filter ────────────────────────────────────── */}
      <div className="tv-surface-elevated p-4 bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap p-1 gap-1 select-none bg-slate-50 border border-slate-200/50 rounded-xl max-w-fit">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => {
                  setFilter(f.value);
                  setRejecting(null);
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                  filter === f.value
                    ? "bg-white text-slate-900 border border-slate-200/60 shadow-xs scale-103"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
            <span>Автоматическая фильтрация спама активна</span>
          </div>
        </div>
      </div>

      {/* ── Content States ──────────────────────────────────────── */}
      {isLoading && (
        <div className="tv-surface-elevated p-12 text-center text-slate-500 bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col items-center justify-center gap-3">
          <RefreshCw className="h-6 w-6 text-teal-600 animate-spin" />
          <p className="text-sm font-semibold">Загружаем список отзывов...</p>
        </div>
      )}

      {!isLoading && reviews && reviews.length === 0 && (
        <div className="tv-surface-elevated p-16 text-center text-slate-400 bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <MessageSquareOff className="h-10 w-10 text-slate-300 mx-auto mb-3.5" />
          <p className="text-sm font-bold text-slate-800">Нет отзывов</p>
          <p className="text-xs text-slate-400 mt-1">Отзывы в выбранной категории отсутствуют.</p>
        </div>
      )}

      {!isLoading && reviews && reviews.length > 0 && (
        <div className="space-y-4">
          {reviews.map((r) => {
            const tourTitle = r.tour ? (r.tour.title[lang] ?? r.tour.title.ru) : "—";
            const initials = getInitials(r.author.fullName);
            const gradientClass = getGradient(r.author.fullName);

            return (
              <div
                key={r.id}
                className="tv-surface-elevated bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-2xl p-5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all duration-300 group"
              >
                {/* Header Information Grid */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3.5">
                    {/* User Initials Avatar */}
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-500/10 shrink-0 select-none`}>
                      {initials}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-800 leading-snug">{r.author.fullName}</h3>
                        <span className="text-xs font-mono text-slate-400 bg-slate-50 border border-slate-200/40 px-2 py-0.5 rounded-lg select-all">
                          {r.userEmail}
                        </span>
                      </div>

                      {r.tour && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                          <Compass className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-600 hover:text-teal-600 transition-colors duration-150 cursor-pointer">
                            {tourTitle}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rating Stars & Timestamp */}
                  <div className="flex md:flex-col items-start md:items-end gap-2 md:gap-1.5 justify-between">
                    <div className="flex items-center gap-0.5 bg-amber-500/5 px-2 py-1 rounded-lg border border-amber-500/10 select-none">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < r.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold font-mono">
                      <Calendar className="w-3 h-3 text-slate-300" />
                      <span>{new Date(r.createdAt).toLocaleString("ru-RU")}</span>
                    </div>
                  </div>
                </div>

                {/* Review Text Area */}
                <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 text-sm text-slate-700 leading-relaxed font-medium mb-4 whitespace-pre-line group-hover:bg-slate-50 transition-colors duration-300">
                  {r.text}
                </div>

                {/* Review Photos Grid */}
                {r.photos && r.photos.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 mb-4">
                    {r.photos.map((url, i) => (
                      <div
                        key={i}
                        className="relative w-24 h-24 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/40 shadow-3xs hover:shadow-2xs group/img duration-200"
                      >
                        <Image
                          src={url}
                          alt="Review attachment"
                          fill
                          className="object-cover group-hover/img:scale-108 duration-300"
                          sizes="96px"
                        />
                      </div>
                    ))}
                  </div>
                )}


                {/* Approve & Reject Mutation Areas */}
                {r.status === "PENDING" && (
                  <div className="border-t border-slate-100 mt-4 pt-4">
                    {rejecting?.id === r.id ? (
                      <div className="space-y-3.5 animate-fade-in">
                        <textarea
                          value={rejecting.reason}
                          onChange={(e) => setRejecting({ ...rejecting, reason: e.target.value })}
                          placeholder="Укажите подробную причину отклонения отзыва (будет видна автору)..."
                          rows={2}
                          className="flex w-full rounded-xl border border-slate-200/80 bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-hidden transition-all placeholder:text-slate-400"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => rejectM.mutate({ id: r.id, reason: rejecting.reason })}
                            disabled={rejectM.isPending || !rejecting.reason.trim()}
                            className="bg-gradient-to-br from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold px-4 py-2 text-xs rounded-xl shadow-xs border-0 shrink-0 transition-transform duration-100 active:scale-98 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5 mr-1" />
                            Отклонить отзыв
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setRejecting(null)}
                            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl border-slate-200 transition-all cursor-pointer"
                          >
                            Отмена
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2.5">
                        <Button
                          onClick={() => approveM.mutate(r.id)}
                          disabled={approveM.isPending}
                          className="bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold px-4.5 py-2 text-xs rounded-xl shadow-xs hover:shadow-md hover:scale-102 duration-150 border-0 shrink-0 transition-transform duration-100 active:scale-98"
                        >
                          <Check className="w-4 h-4 mr-1.5" /> Опубликовать
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setRejecting({ id: r.id, reason: "" })}
                          className="px-4.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200/80 hover:border-slate-300 rounded-xl transition-all hover:scale-102 duration-150 cursor-pointer"
                        >
                          <X className="w-4 h-4 mr-1.5 text-slate-400 group-hover:text-rose-500" /> Отклонить
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { Star, Plus, Clock, Check, X, MessageSquare } from "lucide-react";
import { reviewsApi } from "@/src/shared/api/reviews-api";
import { Button } from "@/src/components/ui/button";

const STATUS_META: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  PENDING:  { label: "На модерации", cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-100", icon: Clock },
  APPROVED: { label: "Опубликован",  cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100", icon: Check },
  REJECTED: { label: "Отклонён",     cls: "bg-rose-50 text-rose-700 ring-1 ring-rose-100", icon: X },
};

export function MyReviewsList() {
  const locale = useLocale();
  const lang = locale as "ru" | "en" | "tj";

  const { data, isLoading } = useQuery({
    queryKey: ["reviews", "my"],
    queryFn: () => reviewsApi.listMy(),
  });

  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            <MessageSquare className="h-3.5 w-3.5 text-teal-600" />
            {data ? `Всего: ${data.length}` : "Загрузка…"}
          </span>
        </div>
        <Link href={`/${locale}/dashboard/reviews/new`}>
          <Button>
            <Plus className="w-4 h-4" /> Написать отзыв
          </Button>
        </Link>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="tv-surface p-5 animate-pulse">
              <div className="h-4 w-1/3 rounded bg-slate-100 mb-2" />
              <div className="h-3 w-1/5 rounded bg-slate-100 mb-3" />
              <div className="h-3 w-full rounded bg-slate-100" />
            </div>
          ))}
        </div>
      )}

      {data && data.length === 0 && (
        <div className="tv-surface-elevated p-12 text-center">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-linear-to-br from-rose-400 to-rose-500 grid place-items-center text-white shadow-[0_10px_24px_-8px_rgba(244,63,94,0.5)]">
            <MessageSquare className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">Отзывов пока нет</h3>
          <p className="mt-1 text-slate-500 max-w-md mx-auto">
            Отзыв можно оставить после оплаченной заявки — расскажите, как прошло путешествие.
          </p>
        </div>
      )}

      <div className="space-y-3.5">
        {data?.map((r) => {
          const tourTitle = r.tour ? (r.tour.title[lang] ?? r.tour.title.ru) : "—";
          const meta = STATUS_META[r.status]!;
          const Icon = meta.icon;
          return (
            <article key={r.id} className="tv-surface p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900">{tourTitle}</h3>
                  <div className="flex items-center gap-1 mt-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < r.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                        }`}
                      />
                    ))}
                    <span className="ml-1.5 text-xs font-semibold text-slate-500 tabular-nums">
                      {r.rating}.0
                    </span>
                  </div>
                </div>
                <span className={`tv-chip ${meta.cls} whitespace-nowrap`}>
                  <Icon className="w-3 h-3" /> {meta.label}
                </span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{r.text}</p>
              {r.photos.length > 0 && (
                <div className="flex gap-2 mt-3.5 flex-wrap">
                  {r.photos.slice(0, 5).map((url: string, i: number) => (
                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 ring-1 ring-slate-200">
                      <Image src={url} alt="" fill className="object-cover" sizes="80px" />
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
                {new Date(r.createdAt).toLocaleString("ru-RU")}
              </p>
            </article>
          );
        })}
      </div>
    </>
  );
}

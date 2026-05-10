"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { Star, Plus, Clock, Check, X } from "lucide-react";
import { reviewsApi } from "@/src/shared/api/reviews-api";
import { Button } from "@/src/components/ui/button";

const STATUS_META: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  PENDING: { label: "На модерации", cls: "bg-amber-100 text-amber-700", icon: Clock },
  APPROVED: { label: "Опубликован", cls: "bg-emerald-100 text-emerald-700", icon: Check },
  REJECTED: { label: "Отклонён", cls: "bg-red-100 text-red-700", icon: X },
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
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-zinc-600">{data ? `Всего: ${data.length}` : "Загрузка…"}</p>
        <Link href={`/${locale}/dashboard/reviews/new`}>
          <Button>
            <Plus className="w-4 h-4 mr-1" /> Написать отзыв
          </Button>
        </Link>
      </div>

      {isLoading && <p className="text-zinc-500">Загрузка…</p>}

      {data && data.length === 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center text-zinc-500">
          <p className="mb-2">У вас пока нет отзывов.</p>
          <p className="text-xs">Отзыв можно оставить только после оплаченной заявки.</p>
        </div>
      )}

      <div className="space-y-3">
        {data?.map((r) => {
          const tourTitle = r.tour ? (r.tour.title[lang] ?? r.tour.title.ru) : "—";
          const meta = STATUS_META[r.status]!;
          const Icon = meta.icon;
          return (
            <div key={r.id} className="bg-white rounded-xl border border-zinc-200 p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-semibold text-zinc-900">{tourTitle}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < r.rating ? "fill-current text-amber-400" : "text-zinc-300"}`} />
                    ))}
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded inline-flex items-center gap-1 ${meta.cls}`}>
                  <Icon className="w-3 h-3" /> {meta.label}
                </span>
              </div>
              <p className="text-sm text-zinc-700 mb-2">{r.text}</p>
              {r.photos.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {r.photos.slice(0, 5).map((url, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-md overflow-hidden bg-zinc-100">
                      <Image src={url} alt="" fill className="object-cover" sizes="64px" />
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-zinc-400 mt-2">{new Date(r.createdAt).toLocaleString("ru-RU")}</p>
            </div>
          );
        })}
      </div>
    </>
  );
}

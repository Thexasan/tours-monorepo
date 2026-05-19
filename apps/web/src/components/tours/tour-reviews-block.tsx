"use client";

import { Star, Award } from "lucide-react";
import { useTranslations } from "next-intl";
import { type Review } from "@tours/types";
import { ReviewCard } from "@/src/components/reviews/review-card";

export function TourReviewsBlock({
  reviews, avgRating, reviewsCount,
}: { reviews: Review[]; avgRating: number; reviewsCount: number }) {
  const t = useTranslations("tours");

  if (!reviews.length) return null;

  const dist = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(r => r.rating === stars).length,
  }));
  const total = reviews.length;

  return (
    <section>
      <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{t("detail.reviewsTitle")}</h2>

      <div className="mt-7 rounded-3xl bg-linear-to-br from-slate-50 via-white to-amber-50/30 ring-1 ring-slate-100 p-6 md:p-8 grid md:grid-cols-[200px_1fr] gap-8">
        <div className="text-center md:border-r md:border-slate-200 md:pr-8">
          <p className="text-6xl font-bold tracking-tight text-slate-900 tabular-nums">{avgRating.toFixed(2)}</p>
          <div className="mt-2 flex items-center justify-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${i < Math.round(avgRating) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"}`}
              />
            ))}
          </div>
          <p className="mt-1 text-sm text-slate-500">{reviewsCount} {t("detail.reviewsCount")}</p>
          {avgRating >= 4.5 && (
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold ring-1 ring-emerald-100">
              <Award className="h-3 w-3" />
              Excellent
            </div>
          )}
        </div>
        <div className="space-y-2">
          {dist.map(d => {
            const pct = total > 0 ? (d.count / total) * 100 : 0;
            return (
              <div key={d.stars} className="flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1 w-10 text-slate-600 font-semibold tabular-nums">
                  {d.stars}
                  <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                </span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-amber-400 to-amber-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-10 text-right text-xs text-slate-500 tabular-nums">{d.count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
      </div>
    </section>
  );
}

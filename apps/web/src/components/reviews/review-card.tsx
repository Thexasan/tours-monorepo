"use client";

import Image from "next/image";
import { Star, Quote } from "lucide-react";
import { useLocale } from "next-intl";
import { type Review } from "@tours/types";

export function ReviewCard({ review }: { review: Review }) {
  const locale = useLocale() as "ru" | "en" | "tj";
  const tourTitle = review.tourTitle[locale] ?? review.tourTitle.ru;

  return (
    <article className="relative h-full flex flex-col rounded-2xl bg-white p-6 ring-1 ring-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.18)] hover:shadow-[0_4px_8px_rgba(15,23,42,0.05),0_18px_36px_-12px_rgba(15,23,42,0.22)] hover:-translate-y-1 transition-all duration-300">
      <Quote
        className="absolute top-5 right-5 h-7 w-7 text-teal-100"
        aria-hidden
      />

      <div className="flex items-center gap-1 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
            }`}
          />
        ))}
      </div>

      <p className="text-[15px] text-slate-700 leading-relaxed line-clamp-4 grow mb-5">
        «{review.text}»
      </p>

      {review.photos && review.photos.length > 0 && (
        <div className="flex gap-2 mb-4">
          {review.photos.slice(0, 3).map((photo, i) => (
            <div
              key={i}
              className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 ring-1 ring-slate-200"
            >
              <Image src={photo} alt="" fill className="object-cover" sizes="56px" />
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
        <div className="relative w-11 h-11 rounded-full overflow-hidden bg-linear-to-br from-teal-400 to-sky-500 shrink-0 ring-2 ring-white shadow-sm">
          {review.author.avatarUrl ? (
            <Image
              src={review.author.avatarUrl}
              alt={review.author.fullName}
              fill
              className="object-cover"
              sizes="44px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-bold">
              {review.author.fullName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-slate-900 truncate">
            {review.author.fullName}
          </p>
          <p className="text-xs text-slate-500 truncate">{tourTitle}</p>
        </div>
      </div>
    </article>
  );
}

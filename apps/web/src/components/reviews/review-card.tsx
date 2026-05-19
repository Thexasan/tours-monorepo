"use client";

import Image from "next/image";
import { Star, MapPin } from "lucide-react";
import { useLocale } from "next-intl";
import { type Review } from "@tours/types";

export function ReviewCard({ review }: { review: Review }) {
  const locale = useLocale() as "ru" | "en" | "tj";
  const tourTitle = review.tourTitle[locale] ?? review.tourTitle.ru;

  return (
    <article className="relative h-full flex flex-col rounded-2xl bg-white p-6 ring-1 ring-slate-100 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_10px_28px_-14px_rgba(15,23,42,0.14)] hover:shadow-[0_4px_8px_rgba(15,23,42,0.04),0_20px_44px_-12px_rgba(249,115,22,0.16)] hover:-translate-y-1.5 transition-all duration-300">

      {/* Large decorative quote — typographic character, not SVG */}
      <span
        aria-hidden
        className="absolute top-3 right-4 text-[80px] font-black leading-none select-none pointer-events-none text-orange-100"
      >
        "
      </span>

      {/* Stars + numeric rating */}
      <div className="flex items-center gap-1.5 mb-4 relative z-10">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < review.rating ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-200"
              }`}
            />
          ))}
        </div>
        <span className="text-[12px] font-bold text-amber-600 ml-0.5">{review.rating}.0</span>
      </div>

      {/* Review text — italic for quotation feel */}
      <p className="text-[15px] italic text-slate-700 leading-[1.75] line-clamp-5 grow mb-5 relative z-10">
        «{review.text}»
      </p>

      {/* Photos — fixed gap, no overlap */}
      {review.photos && review.photos.length > 0 && (
        <div className="flex gap-2 mb-4">
          {review.photos.slice(0, 3).map((photo, i) => (
            <div
              key={i}
              className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 ring-2 ring-white shadow-sm"
            >
              <Image src={photo} alt="" fill className="object-cover" sizes="64px" />
            </div>
          ))}
        </div>
      )}

      {/* Author */}
      <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
        <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 ring-2 ring-orange-100 shadow-sm">
          {review.author.avatarUrl ? (
            <Image
              src={review.author.avatarUrl}
              alt={review.author.fullName}
              fill
              className="object-cover"
              sizes="40px"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center font-bold text-sm text-white"
              style={{ background: "linear-gradient(135deg, #f97316, #0284c7)" }}
            >
              {review.author.fullName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-[13px] text-slate-900 truncate">
            {review.author.fullName}
          </p>
          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
            <MapPin className="h-3 w-3 text-orange-500 shrink-0" />
            {tourTitle}
          </p>
        </div>
      </div>
    </article>
  );
}

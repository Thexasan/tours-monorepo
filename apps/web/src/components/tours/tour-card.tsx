"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, MapPin, Clock, ArrowUpRight, Flame } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { type Tour } from "@tours/types";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useCurrencyStore } from "@/src/shared/store/currency-store";

interface TourCardProps {
  tour: Tour;
  extraQuery?: string;
  variant?: "default" | "overlay";
  featured?: boolean;
}

export function TourCard({ tour, extraQuery, variant = "default", featured = false }: TourCardProps) {
  const t = useTranslations("tours");
  const locale = useLocale() as "ru" | "en" | "tr";
  const { currency, convert } = useCurrencyStore();

  const price = convert(tour.priceUsd);
  const formattedPrice = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);

  const titleLocalized = tour.title[locale] ?? tour.title.ru;
  const href = `/${locale}/tours/${tour.slug}${extraQuery ? `?${extraQuery}` : ""}`;

  /* ─────────────────────────────────────────────
     OVERLAY variant — full-bleed cinematic card
  ───────────────────────────────────────────── */
  if (variant === "overlay") {
    return (
      <Link href={href} className="group block h-full">
        <div className="relative h-full overflow-hidden rounded-3xl bg-slate-900 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_16px_40px_-16px_rgba(15,23,42,0.28)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_4px_8px_rgba(15,23,42,0.06),0_24px_56px_-12px_rgba(15,23,42,0.36)]">

          {/* Image */}
          <Image
            src={tour.coverImage}
            alt={titleLocalized || "Tour Image"}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
          />

          {/* Gradient — heavy at bottom for legibility */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0.08) 70%, transparent 100%)",
            }}
            aria-hidden
          />

          {/* Hot badge */}
          {tour.isHot && (
            <div
              className={`absolute top-4 left-4 z-10 inline-flex items-center gap-1 rounded-full font-bold text-white shadow-[0_4px_14px_-2px_rgba(244,63,94,0.55)] ${featured ? "px-3 py-1.5 text-[12px]" : "px-2.5 py-1 text-[11px]"}`}
              style={{ background: "linear-gradient(135deg, #f43f5e 0%, #f97316 100%)" }}
            >
              <Flame className={featured ? "h-3.5 w-3.5" : "h-3 w-3"} />
              {t("labels.hotTour", { fallback: "Горящий тур" })}
            </div>
          )}

          {/* Hover arrow */}
          <div className={`absolute top-4 right-4 z-10 grid place-items-center rounded-full bg-white shadow-md translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200 ${featured ? "h-11 w-11" : "h-9 w-9"}`}>
            <ArrowUpRight className={featured ? "h-5 w-5 text-orange-600" : "h-4 w-4 text-orange-600"} />
          </div>

          {/* Content overlay — pinned to bottom */}
          <div className={`absolute bottom-0 left-0 right-0 ${featured ? "p-6 md:p-8" : "p-4 md:p-5"}`}>

            {/* Stars + avg rating */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`${featured ? "h-4 w-4" : "h-3 w-3"} ${
                      i < tour.hotelStars ? "fill-amber-400 text-amber-400" : "fill-white/20 text-white/20"
                    }`}
                  />
                ))}
              </div>
              {tour.avgRating > 0 && (
                <span className={`font-bold text-white/90 ${featured ? "text-sm" : "text-[12px]"}`}>
                  {tour.avgRating.toFixed(1)}
                  {tour.reviewsCount > 0 && (
                    <span className="font-normal text-white/55 ml-0.5">({tour.reviewsCount})</span>
                  )}
                </span>
              )}
            </div>

            {/* Title */}
            <h3
              className={`font-bold text-white leading-tight mb-1.5 line-clamp-2 ${
                featured ? "text-2xl md:text-3xl" : "text-base md:text-lg"
              }`}
            >
              {titleLocalized}
            </h3>

            {/* Meal + Duration */}
            <p className={`text-white/60 mb-3 ${featured ? "text-[13px]" : "text-[11px]"}`}>
              {t(`mealPlan.${tour.mealPlan}`, { fallback: tour.mealPlan })}
              {tour.durationDays && (
                <> · {tour.durationDays} {t("labels.days", { fallback: "дн."})}</>
              )}
            </p>

            {/* Price row */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-white/45 text-[10px] uppercase tracking-wider font-semibold mb-0.5">
                  {t("labels.from", { fallback: "от" })}
                </p>
                <p className={`text-white font-extrabold tabular-nums leading-none ${featured ? "text-[28px]" : "text-xl"}`}>
                  {formattedPrice}
                </p>
              </div>
              {tour.country && (
                <span className={`inline-flex items-center gap-1 rounded-full bg-white/12 border border-white/20 font-semibold text-white ${featured ? "px-3 py-1.5 text-[12px]" : "px-2.5 py-1 text-[11px]"}`}>
                  <MapPin className={featured ? "h-3.5 w-3.5 text-rose-400" : "h-3 w-3 text-rose-400"} />
                  {tour.country}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  /* ─────────────────────────────────────────────
     DEFAULT variant — clean minimal card (aviasales-style)
  ───────────────────────────────────────────── */
  return (
    <Link href={href} className="group block h-full">
      <div className="bg-white rounded-xl overflow-hidden border border-slate-100/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 h-full flex flex-col">

        {/* Image — square on mobile, 4:3 on desktop */}
        <div className="relative w-full aspect-square sm:aspect-[4/3] overflow-hidden bg-slate-100 shrink-0">
          <Image
            src={tour.coverImage}
            alt={titleLocalized || "Tour Image"}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />

          {tour.isHot && (
            <div className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 rounded-full bg-rose-500 text-white px-2 py-0.5 text-[10px] font-bold shadow-md shadow-rose-500/30 uppercase tracking-wide">
              <Flame className="h-2.5 w-2.5" /> HOT
            </div>
          )}

          {/* Rating pill — bottom right of image */}
          {tour.avgRating > 0 && (
            <div className="absolute bottom-2 right-2 z-10 inline-flex items-center gap-0.5 rounded-full bg-black/50 backdrop-blur-sm text-white px-1.5 py-0.5 text-[10px] font-bold">
              <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
              {tour.avgRating.toFixed(1)}
            </div>
          )}
        </div>

        {/* Content — minimal */}
        <div className="p-2.5 sm:p-4 flex flex-col grow">
          {/* Country */}
          {tour.country && (
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.12em] text-teal-600 mb-1 truncate">
              {tour.country}
            </p>
          )}

          {/* Title */}
          <h3 className="text-[12px] sm:text-[15px] font-bold text-slate-900 leading-snug line-clamp-2 mb-1.5 sm:mb-2.5 group-hover:text-teal-600 transition-colors">
            {titleLocalized}
          </h3>

          {/* Duration + meal — one line, muted */}
          <p className="text-[10px] sm:text-xs text-slate-400 mb-2 sm:mb-3 flex items-center gap-1">
            <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
            {tour.durationDays} {t("labels.days", { fallback: "дн." })}
            <span className="hidden sm:inline">
              · {t(`mealPlan.${tour.mealPlan}`, { fallback: tour.mealPlan })}
            </span>
          </p>

          {/* Price */}
          <div className="mt-auto">
            <p className="text-[10px] text-slate-400 font-medium leading-none mb-0.5">
              {t("labels.from", { fallback: "от" })}
            </p>
            <p className="text-sm sm:text-xl font-black text-slate-900 leading-none">
              {formattedPrice}
              <span className="text-[9px] sm:text-xs font-medium text-slate-400 ml-1">/чел</span>
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function TourCardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-slate-100/80 flex flex-col">
      <Skeleton className="w-full aspect-square sm:aspect-[4/3] shrink-0 rounded-none" />
      <div className="p-2.5 sm:p-4 flex flex-col gap-1.5 sm:gap-2">
        <Skeleton className="h-2.5 w-12" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-2 w-16 mt-1" />
        <Skeleton className="h-5 w-20 mt-0.5" />
      </div>
    </div>
  );
}

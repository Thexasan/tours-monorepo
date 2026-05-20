"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, MapPin, Clock, ArrowUpRight, Flame } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { type Tour } from "@tours/types";
import { Card, CardContent } from "@/src/components/ui/card";
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
     DEFAULT variant — premium inset card layout
  ───────────────────────────────────────────── */
  return (
    <Link href={href} className="group block h-full">
      <div className="bg-white rounded-[2rem] p-3 border border-slate-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 h-full flex flex-col">
        
        {/* Image wrapped in a rounded container with padding */}
        <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shrink-0 bg-slate-100">
          <Image
            src={tour.coverImage}
            alt={titleLocalized || "Tour Image"}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Subtle top gradient for icons */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />

          {tour.isHot && (
            <div className="absolute top-4 left-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-rose-500 text-white px-3 py-1 text-[11px] font-bold shadow-lg shadow-rose-500/30 tracking-wide uppercase">
              <Flame className="h-3.5 w-3.5" />
              HOT
            </div>
          )}

          {/* Action Button */}
          <div className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 shadow-sm opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-white hover:text-slate-900">
            <ArrowUpRight className="h-5 w-5" />
          </div>
        </div>

        {/* Content */}
        <div className="px-3 pt-5 pb-3 flex flex-col grow">
          <div className="flex items-center justify-between mb-3">
            {tour.country && (
              <span className="inline-flex items-center gap-1 text-[10px] font-black tracking-[0.15em] uppercase text-teal-600 bg-teal-50 px-2.5 py-1 rounded-md">
                <MapPin className="w-3 h-3" /> {tour.country}
              </span>
            )}
            
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-bold text-slate-900">
                {tour.avgRating > 0 ? tour.avgRating.toFixed(1) : "Новый"}
              </span>
              {tour.reviewsCount > 0 && (
                <span className="text-sm text-slate-400 ml-0.5">({tour.reviewsCount})</span>
              )}
            </div>
          </div>
          
          <h3 className="text-[19px] font-black text-slate-900 leading-[1.3] mb-4 group-hover:text-teal-600 transition-colors line-clamp-2">
            {titleLocalized}
          </h3>

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 font-medium mb-6">
            {tour.durationDays && (
              <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg">
                <Clock className="w-4 h-4 text-slate-400" /> {tour.durationDays} {t("labels.days", { fallback: "дн." })}
              </span>
            )}
            <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg">
              {t(`mealPlan.${tour.mealPlan}`, { fallback: tour.mealPlan })}
            </span>
          </div>

          {/* Price */}
          <div className="mt-auto pt-4 border-t border-slate-100 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1">
                {t("labels.from", { fallback: "Стоимость" })}
              </p>
              <p className="text-2xl font-black text-slate-900 flex items-baseline gap-1">
                {formattedPrice} <span className="text-sm font-medium text-slate-500">/чел</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function TourCardSkeleton() {
  return (
    <Card className="flex flex-row md:flex-col h-full overflow-hidden">
      <Skeleton className="w-2/5 md:w-full h-32 md:aspect-[4/3] shrink-0 rounded-none" />
      <CardContent className="flex flex-col p-4 w-3/5 md:w-full gap-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-5 w-12 rounded-lg" />
        </div>
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <div className="mt-auto flex items-end justify-between pt-1">
          <div>
            <Skeleton className="h-2.5 w-8 mb-1" />
            <Skeleton className="h-7 w-24" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

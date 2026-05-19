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
  const locale = useLocale() as "ru" | "en" | "tj";
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
            <ArrowUpRight className={featured ? "h-5 w-5 text-teal-600" : "h-4 w-4 text-teal-600"} />
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
     DEFAULT variant — image top, content below
  ───────────────────────────────────────────── */
  return (
    <Link href={href} className="group block h-full">
      <Card className="overflow-hidden flex flex-row md:flex-col h-full transition-all duration-200 ease-out hover:-translate-y-1.5 hover:shadow-[0_20px_44px_-12px_rgba(13,148,136,0.18),0_4px_12px_-4px_rgba(15,23,42,0.10)]">

        {/* Image */}
        <div className="relative w-2/5 md:w-full md:aspect-[4/3] shrink-0 overflow-hidden bg-slate-100">
          <Image
            src={tour.coverImage}
            alt={titleLocalized || "Tour Image"}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.07]"
            sizes="(max-width: 768px) 40vw, (max-width: 1200px) 25vw, 20vw"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.12) 40%, transparent 70%)" }}
            aria-hidden
          />
          {tour.isHot && (
            <div
              className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white shadow-[0_4px_12px_-2px_rgba(244,63,94,0.5)]"
              style={{ background: "linear-gradient(135deg, #f43f5e 0%, #f97316 100%)" }}
            >
              <Flame className="h-3 w-3" />
              {t("labels.hotTour", { fallback: "Горящий тур" })}
            </div>
          )}
          <div className="absolute top-3 right-3 z-10 grid place-items-center h-9 w-9 rounded-full bg-white shadow-md translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
            <ArrowUpRight className="h-4 w-4 text-teal-600" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 px-3.5 pb-3.5 hidden md:flex items-end justify-between gap-2">
            {tour.country && (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white">
                <MapPin className="h-3 w-3 text-rose-400" />{tour.country}
              </span>
            )}
            {tour.durationDays && (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white">
                <Clock className="h-3 w-3 text-teal-300" />
                {tour.durationDays} {t("labels.days", { fallback: "дн." })}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <CardContent className="flex flex-col p-4 md:p-5 w-3/5 md:w-full grow">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-3.5 w-3.5 ${i < tour.hotelStars ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-200"}`} />
              ))}
            </div>
            {tour.avgRating > 0 && (
              <div className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                {tour.avgRating.toFixed(1)}
                {tour.reviewsCount > 0 && <span className="font-normal text-amber-500/80">({tour.reviewsCount})</span>}
              </div>
            )}
          </div>
          <h3 className="line-clamp-2 text-[15px] font-bold text-slate-900 group-hover:text-teal-700 transition-colors mb-2.5 leading-snug">
            {titleLocalized}
          </h3>
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="inline-flex items-center text-[11px] font-medium text-slate-500 bg-slate-50 rounded-full px-2.5 py-0.5 border border-slate-100">
              {t(`mealPlan.${tour.mealPlan}`, { fallback: tour.mealPlan })}
            </span>
            {tour.durationDays && (
              <span className="md:hidden inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 rounded-full px-2.5 py-0.5 border border-slate-100">
                <Clock className="h-3 w-3" />
                {tour.durationDays} {t("labels.days", { fallback: "дней" })}
              </span>
            )}
          </div>
          <div className="mt-auto flex items-end justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                {t("labels.from", { fallback: "от" })}
              </p>
              <p className="text-[22px] font-extrabold text-teal-700 tabular-nums leading-none">{formattedPrice}</p>
            </div>
            <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white group-hover:shadow-[0_6px_20px_-4px_rgba(13,148,136,0.55)] transition-all duration-200">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
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

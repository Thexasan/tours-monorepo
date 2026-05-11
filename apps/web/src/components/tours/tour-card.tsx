"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, MapPin, Clock, ArrowUpRight } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { type Tour } from "@tours/types";
import { Card, CardContent } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useCurrencyStore } from "@/src/shared/store/currency-store";

export function TourCard({ tour }: { tour: Tour }) {
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

  return (
    <Link href={`/${locale}/tours/${tour.slug}`} className="group block h-full">
      <Card className="overflow-hidden flex flex-row md:flex-col h-full hover:-translate-y-1 transition-transform">
        <div className="relative w-2/5 md:w-full md:aspect-[4/3] shrink-0 overflow-hidden bg-slate-100">
          <Image
            src={tour.coverImage}
            alt={titleLocalized || "Tour Image"}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 40vw, (max-width: 1200px) 25vw, 20vw"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 md:opacity-100" aria-hidden />
          {tour.isHot && (
            <div className="absolute top-3 left-3 z-10">
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-[0_4px_12px_-2px_rgba(244,63,94,0.5)]">
                🔥 {t("labels.hotTour", { fallback: "Горячий тур" })}
              </span>
            </div>
          )}
          {/* Country chip */}
          {tour.country && (
            <div className="absolute bottom-3 left-3 z-10 hidden md:inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur px-2.5 py-1 text-[11px] font-semibold text-slate-800 ring-1 ring-white/50">
              <MapPin className="h-3 w-3 text-rose-500" />
              {tour.country}
            </div>
          )}
          {/* Hover arrow */}
          <div className="absolute top-3 right-3 z-10 grid place-items-center h-9 w-9 rounded-full bg-white/95 backdrop-blur translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <ArrowUpRight className="h-4 w-4 text-teal-700" />
          </div>
        </div>

        <CardContent className="flex flex-col p-4 md:p-5 w-3/5 md:w-full flex-grow">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${
                    i < tour.hotelStars ? "fill-amber-400 text-amber-400" : "text-slate-200"
                  }`}
                />
              ))}
            </div>
          </div>

          <h3 className="line-clamp-2 text-[15px] md:text-base font-semibold text-slate-900 group-hover:text-teal-700 transition-colors mb-1.5 leading-snug">
            {titleLocalized}
          </h3>

          <p className="text-xs text-slate-500 flex items-center gap-1 mb-4">
            <Clock className="h-3 w-3" />
            {t(`mealPlan.${tour.mealPlan}`, { fallback: tour.mealPlan })} · {tour.durationDays}{" "}
            {t("labels.days", { fallback: "дней" })}
          </p>

          <div className="mt-auto flex items-end justify-between pt-3 border-t border-slate-100">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {t("labels.from", { fallback: "от" })}
              </p>
              <p className="text-lg font-bold text-slate-900 tabular-nums leading-tight">
                {formattedPrice}
              </p>
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
      <Skeleton className="w-2/5 md:w-full h-32 md:h-48 md:aspect-[4/3] shrink-0 rounded-none" />
      <CardContent className="flex flex-col p-4 w-3/5 md:w-full">
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-5 w-full mb-2" />
        <Skeleton className="h-5 w-2/3 mb-4" />
        <Skeleton className="h-4 w-32 mb-auto" />
        <div className="mt-4">
          <Skeleton className="h-3 w-8 mb-1" />
          <Skeleton className="h-6 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { type Tour } from "@tours/types";
import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
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
    <Link href={`/${locale}/tours/${tour.slug}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-md flex flex-row md:flex-col h-full">
        <div className="relative w-2/5 md:w-full md:aspect-[4/3] shrink-0 overflow-hidden">
          <Image
            src={tour.coverImage}
            alt={titleLocalized || "Tour Image"}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 40vw, (max-width: 1200px) 25vw, 20vw"
          />
          {tour.isHot && (
            <div className="absolute top-2 left-2 z-10">
              <Badge variant="destructive" className="font-medium shadow-sm">
                {t("labels.hotTour", { fallback: "Горячий тур" })}
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="flex flex-col p-4 w-3/5 md:w-full flex-grow">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < tour.hotelStars ? "fill-current" : "text-zinc-300"}`}
                />
              ))}
            </div>
          </div>

          <h3 className="line-clamp-2 text-base font-semibold text-zinc-900 md:text-lg mb-1">
            {titleLocalized}
          </h3>

          <div className="mb-4 text-sm text-zinc-500">
            <p>
              {t(`mealPlan.${tour.mealPlan}`, { fallback: tour.mealPlan })} • {tour.durationDays}{" "}
              {t("labels.days", { fallback: "дней" })}
            </p>
          </div>

          <div className="mt-auto flex items-end justify-between">
            <div>
              <p className="text-xs text-zinc-500">{t("labels.from", { fallback: "от" })}</p>
              <p className="text-lg font-bold text-zinc-900">{formattedPrice}</p>
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

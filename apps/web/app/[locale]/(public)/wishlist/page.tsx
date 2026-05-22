"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, ArrowLeft, Flame, TrendingDown, Star, Clock } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/src/shared/store/auth-store";
import { useWishlistMy, useWishlistToggle } from "@/src/shared/hooks/use-wishlist";
import { cn } from "@/src/lib/utils";
import type { WishlistItem } from "@/src/shared/api/wishlist-api";

export default function WishlistPage() {
  const locale = useLocale();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    if (isHydrated && !user) {
      router.replace(`/${locale}/login?redirect=/${locale}/wishlist`);
    }
  }, [isHydrated, user, router, locale]);

  const { data, isLoading } = useWishlistMy();

  if (!isHydrated || !user) return null;

  const items = data?.items ?? [];
  const priceDropCount = items.filter((i) => i.priceDrop).length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-8">
          <Link
            href={`/${locale}/tours`}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            К турам
          </Link>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-slate-900">Избранное</h1>
                {items.length > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold ring-1 ring-teal-100">
                    {items.length} {items.length === 1 ? "тур" : items.length < 5 ? "тура" : "туров"}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500">Сохранённые туры — мы уведомим вас при снижении цены</p>
            </div>

            {priceDropCount > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 text-rose-700 text-sm font-semibold ring-1 ring-rose-100">
                <TrendingDown className="h-4 w-4" />
                Цена снизилась на {priceDropCount} {priceDropCount === 1 ? "туре" : "турах"}!
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-8">
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                <div className="h-52 bg-slate-200" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="h-8 bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="grid place-items-center h-20 w-20 rounded-full bg-teal-50 mb-5">
              <Heart className="h-9 w-9 text-teal-300" />
            </div>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">Список пуст</h2>
            <p className="text-slate-500 text-sm max-w-sm mb-6">
              Нажмите на ♡ на любом туре, чтобы сохранить его здесь. Мы уведомим вас, если цена снизится.
            </p>
            <Link
              href={`/${locale}/tours`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-[0_6px_20px_-6px_rgba(2,116,85,0.40)]"
            >
              Смотреть туры
            </Link>
          </div>
        )}

        {!isLoading && items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <WishlistCard key={item.id} item={item} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WishlistCard({ item, locale }: { item: WishlistItem; locale: string }) {
  const toggle = useWishlistToggle(item.tourId);
  const { tour, priceDrop, priceAtSave } = item;
  const title = (tour.title as Record<string, string>)[locale] ?? (tour.title as Record<string, string>).ru ?? "";
  const savings = priceAtSave - tour.priceUsd;

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.06),0_8px_24px_-8px_rgba(15,23,42,0.08)] hover:shadow-[0_1px_3px_rgba(15,23,42,0.06),0_16px_40px_-12px_rgba(15,23,42,0.14)] transition-shadow">
      {/* Cover */}
      <div className="relative h-52 overflow-hidden bg-slate-200">
        <Link href={`/${locale}/tours/${tour.slug}`}>
          <Image
            src={tour.coverImage}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {tour.isHot && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
              style={{ background: "linear-gradient(135deg,#f97316,#f43f5e)" }}>
              <Flame className="h-2.5 w-2.5" />Горящий
            </span>
          )}
          {priceDrop && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white">
              <TrendingDown className="h-2.5 w-2.5" />
              −${savings.toLocaleString()}
            </span>
          )}
        </div>

        {/* Remove button */}
        <button
          type="button"
          onClick={() => toggle.mutate()}
          disabled={toggle.isPending}
          className="absolute top-3 right-3 grid place-items-center h-8 w-8 rounded-full bg-white/90 backdrop-blur text-rose-500 shadow hover:bg-white transition"
          aria-label="Убрать из избранного"
        >
          <Heart className="h-4 w-4 fill-rose-500" />
        </button>
      </div>

      {/* Content */}
      <div className="p-5">
        <Link href={`/${locale}/tours/${tour.slug}`} className="block">
          <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 mb-1 group-hover:text-teal-700 transition-colors">
            {title}
          </h3>
        </Link>

        <p className="text-xs text-slate-500 mb-3">
          {[tour.city, tour.country].filter(Boolean).join(", ")}
        </p>

        <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
          {tour.avgRating > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
              {tour.avgRating.toFixed(1)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {tour.durationDays} дн.
          </span>
        </div>

        {/* Price */}
        <div className="flex items-end justify-between gap-2 mb-4">
          <div>
            {priceDrop && (
              <p className="text-[10px] text-slate-400 line-through tabular-nums">
                ${priceAtSave.toLocaleString()} / чел.
              </p>
            )}
            <p className={cn("text-xl font-bold tabular-nums", priceDrop ? "text-emerald-600" : "text-slate-900")}>
              ${tour.priceUsd.toLocaleString()}
              <span className="text-xs font-normal text-slate-400 ml-1">/ чел.</span>
            </p>
          </div>
          {priceDrop && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <TrendingDown className="h-3 w-3" />
              Дешевле!
            </span>
          )}
        </div>

        <Link
          href={`/${locale}/tours/${tour.slug}?book=1`}
          className="block w-full text-center py-2.5 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-[0_6px_20px_-6px_rgba(2,116,85,0.40)] hover:-translate-y-0.5 transition-all"
        >
          Забронировать
        </Link>
      </div>
    </div>
  );
}

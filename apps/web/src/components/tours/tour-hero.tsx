"use client";

import Image from "next/image";
import Link from "next/link";
import {
  MapPin, Star, Sparkles, ChevronRight, ChevronDown,
  ArrowRight, Share2, Pencil,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { WishlistButton } from "@/src/components/wishlist/wishlist-button";
import { useAuthStore } from "@/src/shared/store/auth-store";

interface Props {
  tourId: string;
  title: string;
  durationDays: number;
  country: string;
  city: string | null;
  region?: string;
  coverImage: string;
  priceUsd: number;
  oldPriceUsd?: number;
  avgRating: number;
  reviewsCount: number;
  isHot: boolean;
  locale: string;
  onBook: () => void;
}

export function TourHero({
  tourId, title, country, city, region, coverImage, priceUsd, oldPriceUsd,
  avgRating, reviewsCount, isHot, locale, onBook,
}: Props) {
  const t = useTranslations("tours");
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";
  const discount = oldPriceUsd ? Math.round((1 - priceUsd / oldPriceUsd) * 100) : 0;
  const loc = region || [city, country].filter(Boolean).join(", ");

  const dashIdx = title.indexOf(" — ");
  const titleMain = dashIdx > -1 ? title.slice(0, dashIdx) : title;
  const titleSub = dashIdx > -1 ? title.slice(dashIdx + 3) : null;

  return (
    <section className="relative -mt-16 h-[62vh] sm:h-[78vh] md:h-[88vh] min-h-[500px] sm:min-h-[560px] md:min-h-[640px] overflow-hidden bg-slate-900">
      <Image
        src={coverImage}
        alt={title}
        fill
        priority
        sizes="100vw"
        className="object-cover"
        style={{ animation: "kenBurns 20s ease-in-out infinite alternate" }}
      />
      <div aria-hidden className="absolute inset-0 bg-linear-to-t from-slate-950/85 via-slate-950/30 to-slate-950/5" />
      <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.35) 100%)" }} />

      <div className="relative z-10 h-full flex flex-col justify-end pb-12 sm:pb-20 md:pb-28">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8">
          <nav className="flex items-center gap-1.5 text-xs text-white/70 mb-5">
            <a href={`/${locale}`} className="hover:text-white transition-colors">{t("detail.breadcrumbHome")}</a>
            <ChevronRight className="h-3 w-3" />
            <a href={`/${locale}/tours`} className="hover:text-white transition-colors">{t("detail.breadcrumbTours")}</a>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white/50">{country}</span>
          </nav>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {isHot && (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-white shadow-[0_8px_20px_-6px_rgba(16,185,129,0.45)]"
                style={{ background: "linear-gradient(135deg, #03956a, #027455)" }}
              >
                <Sparkles className="h-3 w-3" />
                {t("detail.hotTourBadge")}{discount > 0 ? ` · −${discount}%` : ""}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 text-white text-[11px] font-bold backdrop-blur ring-1 ring-white/25">
              <MapPin className="h-3 w-3 text-rose-300" />
              {loc}
            </span>
            {reviewsCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 text-white text-[11px] font-bold backdrop-blur ring-1 ring-white/25">
                <Star className="h-3 w-3 text-amber-300 fill-amber-300" />
                {avgRating.toFixed(2)} · {reviewsCount} {t("detail.reviewsCount")}
              </span>
            )}
          </div>

          <h1
            className="font-bold text-white leading-[0.95] tracking-[-0.02em] drop-shadow-[0_4px_28px_rgba(0,0,0,0.5)] max-w-5xl"
            style={{ fontSize: "clamp(26px, 5vw, 84px)" }}
          >
            {titleMain}
          </h1>
          {titleSub && (
            <div className="mt-2 md:mt-3">
              <span
                className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/15 text-white/90 font-semibold backdrop-blur ring-1 ring-white/20"
                style={{ fontSize: "clamp(13px, 2vw, 26px)" }}
              >
                {titleSub}
              </span>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-end gap-x-8 gap-y-3">
            <div className="text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60 mb-1">{t("detail.priceFrom")}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl md:text-5xl font-bold tabular-nums tracking-tight">${priceUsd.toLocaleString()}</p>
                {oldPriceUsd && (
                  <p className="text-base md:text-lg text-white/50 line-through tabular-nums">${oldPriceUsd.toLocaleString()}</p>
                )}
              </div>
              <p className="text-xs text-white/70 mt-1">{t("detail.perPerson")}</p>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              {isAdmin ? (
                <>
                  <Link
                    href={`/${locale}/admin/tours/${tourId}/edit`}
                    className="group inline-flex items-center gap-1.5 md:gap-2 px-5 py-3 md:px-7 md:py-4 rounded-full text-sm md:text-base font-bold text-white transition-all hover:-translate-y-0.5"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 18px 36px -12px rgba(124,58,237,0.45)" }}
                  >
                    <Pencil className="h-4 w-4 md:h-[18px] md:w-[18px]" />
                    {t("hero.editTour")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof navigator !== "undefined" && navigator.share) {
                        navigator.share({ title, url: typeof window !== "undefined" ? window.location.href : "" }).catch(() => {});
                      }
                    }}
                    className="grid place-items-center h-11 w-11 md:h-14 md:w-14 rounded-full bg-white/10 text-white backdrop-blur ring-1 ring-white/25 hover:bg-white/20 transition"
                    aria-label={t("hero.share")}
                  >
                    <Share2 className="h-4 w-4 md:h-5 md:w-5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onBook}
                    className="group inline-flex items-center gap-1.5 md:gap-2 px-5 py-3 md:px-7 md:py-4 rounded-full text-sm md:text-base font-bold text-white transition-all hover:-translate-y-0.5"
                    style={{ background: "linear-gradient(135deg, #03956a, #027455)", boxShadow: "0 18px 36px -12px rgba(2,116,85,0.50)" }}
                  >
                    {t("hero.book")}
                    <ArrowRight className="h-4 w-4 md:h-[18px] md:w-[18px] transition-transform group-hover:translate-x-1" />
                  </button>
                  <WishlistButton
                    tourId={tourId}
                    variant="hero"
                    label={t("hero.wishlist")}
                    labelActive={t("hero.wishlisted")}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof navigator !== "undefined" && navigator.share) {
                        navigator.share({ title, url: typeof window !== "undefined" ? window.location.href : "" }).catch(() => {});
                      }
                    }}
                    className="grid place-items-center h-11 w-11 md:h-14 md:w-14 rounded-full bg-white/10 text-white backdrop-blur ring-1 ring-white/25 hover:bg-white/20 transition"
                    aria-label={t("hero.share")}
                  >
                    <Share2 className="h-4 w-4 md:h-5 md:w-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div aria-hidden className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/50 animate-bounce">
        <ChevronDown className="h-5 w-5" />
      </div>
    </section>
  );
}

import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Star, Check, X, Calendar, MapPin, Users, Hotel, Utensils,
  ChevronRight, Shield, Clock, Headphones, Sparkles, Compass, ArrowRight,
} from "lucide-react";
import { type Tour, type Review } from "@tours/types";
import { ReviewCard } from "@/src/components/reviews/review-card";
import { BookButton } from "@/src/components/bookings/book-button";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

interface TourDetail extends Tour {
  reviews: Review[];
}

const MEAL_LABELS: Record<string, string> = {
  ALL_INCLUSIVE: "Всё включено",
  HALF_BOARD: "Полупансион",
  BREAKFAST: "Завтраки",
  NO_MEALS: "Без питания",
};

async function fetchTour(slug: string): Promise<TourDetail | null> {
  try {
    const res = await fetch(`${API_URL}/tours/${slug}`, { next: { revalidate: 600 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function TourDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const tour = await fetchTour(slug);
  if (!tour) notFound();

  const lang = (locale as "ru" | "en" | "tj") ?? "ru";
  const title = tour.title[lang] ?? tour.title.ru ?? tour.slug;
  const description = tour.description[lang] ?? tour.description.ru ?? "";
  const includedList: string[] = tour.programIncluded[lang] ?? tour.programIncluded.ru ?? [];
  const excludedList: string[] = tour.programExcluded[lang] ?? tour.programExcluded.ru ?? [];
  const mealLabel = MEAL_LABELS[tour.mealPlan] ?? tour.mealPlan;

  return (
    <main className="min-h-screen bg-[var(--gradient-page)]">
      {/* HERO */}
      <section className="relative">
        <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden">
          <Image
            src={tour.coverImage}
            alt={title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/30 to-transparent" />
          {tour.isHot && (
            <span className="absolute top-6 left-6 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/95 text-white text-xs font-semibold shadow-lg backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Горящий тур
            </span>
          )}

          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
            <div className="mx-auto max-w-6xl">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-1.5 text-xs text-white/80 mb-3">
                <Link href={`/${locale}`} className="hover:text-white transition-colors">Главная</Link>
                <ChevronRight className="h-3 w-3" />
                <Link href={`/${locale}/tours`} className="hover:text-white transition-colors">Туры</Link>
                <ChevronRight className="h-3 w-3" />
                <span className="text-white/60 truncate max-w-[40ch]">{title}</span>
              </nav>

              <div className="flex items-center gap-2 text-white/90 text-sm mb-2">
                <MapPin className="h-4 w-4 text-teal-300" />
                <span>{[tour.city, tour.country].filter(Boolean).join(", ")}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-bold text-white drop-shadow-md max-w-4xl">
                {title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/90">
                <span className="inline-flex items-center gap-1 text-amber-300">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < tour.hotelStars ? "fill-amber-300" : "text-white/30"}`} />
                  ))}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />{tour.durationDays} дней
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Utensils className="h-4 w-4" />{mealLabel}
                </span>
                {tour.reviewsCount > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
                    {tour.avgRating.toFixed(1)} · {tour.reviewsCount} {tour.reviewsCount === 1 ? "отзыв" : "отзывов"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT — content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Photo gallery */}
            {tour.images.length > 0 && (
              <div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {tour.images.slice(0, 6).map((img, i) => (
                    <div
                      key={i}
                      className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 ring-1 ring-slate-200/70 hover:ring-teal-300 transition-all"
                    >
                      <Image src={img} alt={`${title} ${i + 1}`} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key facts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl bg-white p-4 ring-1 ring-slate-100 shadow-[var(--shadow-xs)]">
                <Calendar className="h-5 w-5 text-teal-600 mb-2" />
                <p className="text-xs text-slate-500">Длительность</p>
                <p className="font-semibold text-slate-900">{tour.durationDays} дней</p>
              </div>
              <div className="rounded-xl bg-white p-4 ring-1 ring-slate-100 shadow-[var(--shadow-xs)]">
                <Hotel className="h-5 w-5 text-sky-600 mb-2" />
                <p className="text-xs text-slate-500">Отель</p>
                <p className="font-semibold text-slate-900 truncate">{tour.hotelName ?? `${tour.hotelStars}★`}</p>
              </div>
              <div className="rounded-xl bg-white p-4 ring-1 ring-slate-100 shadow-[var(--shadow-xs)]">
                <Utensils className="h-5 w-5 text-amber-600 mb-2" />
                <p className="text-xs text-slate-500">Питание</p>
                <p className="font-semibold text-slate-900">{mealLabel}</p>
              </div>
              <div className="rounded-xl bg-white p-4 ring-1 ring-slate-100 shadow-[var(--shadow-xs)]">
                <Compass className="h-5 w-5 text-rose-500 mb-2" />
                <p className="text-xs text-slate-500">Направление</p>
                <p className="font-semibold text-slate-900 truncate">{tour.country}</p>
              </div>
            </div>

            {/* Description */}
            {description && (
              <article className="prose prose-slate max-w-none">
                <h2 className="text-2xl font-bold text-slate-900 mb-3">О туре</h2>
                <p className="text-slate-700 leading-relaxed whitespace-pre-line text-[15px]">{description}</p>
              </article>
            )}

            {/* Included / Excluded */}
            {(includedList.length > 0 || excludedList.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {includedList.length > 0 && (
                  <div className="rounded-2xl bg-gradient-to-br from-emerald-50/50 to-white ring-1 ring-emerald-100 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="grid place-items-center h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700">
                        <Check className="h-4 w-4" />
                      </span>
                      <h3 className="font-semibold text-slate-900">В стоимость включено</h3>
                    </div>
                    <ul className="space-y-2.5">
                      {includedList.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                          <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {excludedList.length > 0 && (
                  <div className="rounded-2xl bg-gradient-to-br from-rose-50/50 to-white ring-1 ring-rose-100 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="grid place-items-center h-8 w-8 rounded-lg bg-rose-100 text-rose-700">
                        <X className="h-4 w-4" />
                      </span>
                      <h3 className="font-semibold text-slate-900">Не включено</h3>
                    </div>
                    <ul className="space-y-2.5">
                      {excludedList.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                          <X className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Reviews */}
            {tour.reviews.length > 0 && (
              <section>
                <div className="flex items-end justify-between gap-3 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Отзывы туристов</h2>
                    <p className="text-sm text-slate-500 mt-1">
                      {tour.reviewsCount} {tour.reviewsCount === 1 ? "отзыв" : "отзывов"} · средняя оценка{" "}
                      <span className="font-semibold text-slate-900">{tour.avgRating.toFixed(1)}</span>
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-5 w-5 ${i < Math.round(tour.avgRating) ? "fill-amber-400" : "text-slate-200"}`} />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tour.reviews.map((r) => (
                    <ReviewCard key={r.id} review={r} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT — sticky booking card */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-3">
              <div className="relative rounded-2xl bg-white ring-1 ring-slate-100 p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_40px_-20px_rgba(13,148,136,0.35)] overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-teal-500 via-sky-500 to-rose-500" />

                <div className="flex items-end justify-between mb-1">
                  <p className="text-xs text-slate-500">Цена за человека</p>
                  {tour.isHot && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-semibold ring-1 ring-rose-100">
                      <Sparkles className="h-3 w-3" />
                      Hot
                    </span>
                  )}
                </div>

                <p className="text-4xl font-bold text-slate-900 mb-1 tabular-nums">
                  ${tour.priceUsd}
                  <span className="text-base font-medium text-slate-400 ml-1">USD</span>
                </p>
                <p className="text-xs text-slate-500 mb-5">
                  включая отель, перелёт, трансфер и страховку
                </p>

                <BookButton
                  tourId={tour.id}
                  tourTitle={title}
                  pricePerPerson={Number(tour.priceUsd)}
                />

                <div className="mt-4 grid grid-cols-1 gap-2.5 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="grid place-items-center h-7 w-7 rounded-lg bg-teal-50 text-teal-700">
                      <Clock className="h-3.5 w-3.5" />
                    </span>
                    Менеджер свяжется в течение часа
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="grid place-items-center h-7 w-7 rounded-lg bg-emerald-50 text-emerald-700">
                      <Shield className="h-3.5 w-3.5" />
                    </span>
                    Бесплатная отмена до подтверждения
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="grid place-items-center h-7 w-7 rounded-lg bg-sky-50 text-sky-700">
                      <Headphones className="h-3.5 w-3.5" />
                    </span>
                    Поддержка 24/7 по WhatsApp
                  </div>
                </div>
              </div>

              {/* Referral CTA card */}
              <div className="rounded-2xl bg-gradient-to-br from-teal-600 to-sky-700 text-white p-5 shadow-[var(--shadow-glow-teal)]">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-teal-200" />
                  <p className="font-semibold">Путешествуй бесплатно</p>
                </div>
                <p className="text-sm text-teal-50/90 mb-3">
                  Приведи 50 друзей — получи этот тур в подарок.
                </p>
                <Link
                  href={`/${locale}/register`}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-white hover:text-teal-100 transition-colors"
                >
                  Как это работает <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

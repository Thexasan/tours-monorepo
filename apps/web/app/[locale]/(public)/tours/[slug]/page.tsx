import { notFound } from "next/navigation";
import { Hotel, Star as StarIcon, Utensils, Wifi } from "lucide-react";
import { type Tour, type Review } from "@tours/types";
import { TourDetailHeroWithModal } from "@/src/components/tours/tour-detail-shell";
import { TourHighlightsBar } from "@/src/components/tours/tour-highlights-bar";
import { TourIncludedExcluded } from "@/src/components/tours/tour-included-excluded";
import { TourItinerary, type ItineraryDay } from "@/src/components/tours/tour-itinerary";
import { TourGallery } from "@/src/components/tours/tour-gallery";
import { TourReviewsBlock } from "@/src/components/tours/tour-reviews-block";
import { TourBookingSidebar } from "@/src/components/tours/tour-booking-sidebar";
import { TourSimilar } from "@/src/components/tours/tour-similar";

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

async function fetchSimilar(country: string): Promise<Tour[]> {
  try {
    const r = await fetch(
      `${API_URL}/tours?country=${encodeURIComponent(country)}&pageSize=3`,
      { next: { revalidate: 600 } },
    );
    if (!r.ok) return [];
    const d = await r.json();
    return Array.isArray(d) ? d : (d.items ?? []);
  } catch {
    return [];
  }
}

function deriveItinerary(description: string, durationDays: number): ItineraryDay[] {
  if (!description) return [];
  const paragraphs = description.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const titles = [
    "Прибытие · Welcome dinner",
    "Знакомство и адаптация",
    "Главная экскурсия",
    "Свободный день",
    "Культурная программа",
    "Гастрономический день",
    "Природа и активности",
    "Шопинг и сувениры",
    "Прощальный ужин",
    "Возвращение домой",
  ];
  return Array.from({ length: durationDays }).map((_, i) => ({
    day: i + 1,
    title: titles[i] ?? `День ${i + 1}`,
    desc: paragraphs[i] ?? "Подробная программа дня будет согласована с вашим менеджером после бронирования.",
  }));
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
  const region = [tour.city, tour.country].filter(Boolean).join(", ");
  const itinerary = deriveItinerary(description, tour.durationDays);

  const similar = (await fetchSimilar(tour.country)).filter(t => t.id !== tour.id);

  return (
    <main className="min-h-screen text-slate-900">
      {/* Hero — owns booking modal trigger */}
      <TourDetailHeroWithModal
        tourId={tour.id}
        title={title}
        country={tour.country}
        city={tour.city ?? null}
        region={region}
        coverImage={tour.coverImage}
        priceUsd={Number(tour.priceUsd)}
        avgRating={tour.avgRating}
        reviewsCount={tour.reviewsCount}
        isHot={tour.isHot}
        hotelStars={tour.hotelStars}
        durationDays={tour.durationDays}
        roomTypes={tour.roomTypes}
        locale={locale}
      />

      <TourHighlightsBar
        region={tour.city ?? tour.country}
        country={tour.country}
        durationDays={tour.durationDays}
        durationNights={Math.max(1, tour.durationDays - 1)}
        avgRating={tour.avgRating}
        reviewsCount={tour.reviewsCount}
      />

      {/* Main content */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-10 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-10">

          {/* Left column */}
          <div className="space-y-12 min-w-0">
            {/* About + hotel meta */}
            <article>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">О туре</h2>
              <p className="mt-5 text-slate-700 leading-relaxed text-[17px] max-w-3xl whitespace-pre-line">{description}</p>

              {tour.hotelName && (
                <div className="mt-7 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-teal-50/40 ring-1 ring-slate-100 p-5 flex flex-wrap items-center gap-x-8 gap-y-3">
                  <MetaItem Icon={Hotel} tone="text-teal-700" label="Отель" value={tour.hotelName} />
                  <MetaItem Icon={StarIcon} tone="text-amber-500" label="Категория" value={`${tour.hotelStars}★`} />
                  <MetaItem Icon={Utensils} tone="text-rose-500" label="Питание" value={mealLabel} />
                  <MetaItem Icon={Wifi} tone="text-sky-600" label="Удобства" value="Wi-Fi · Бассейн · Спа" />
                </div>
              )}

              <div className="mt-8">
                <TourIncludedExcluded included={includedList} excluded={excludedList} />
              </div>
            </article>

            {/* Itinerary */}
            <TourItinerary
              days={itinerary}
              durationDays={tour.durationDays}
              durationNights={Math.max(1, tour.durationDays - 1)}
            />

            {/* Gallery */}
            {tour.images.length > 0 && (
              <TourGallery images={tour.images} title={title} />
            )}

            {/* Reviews */}
            <TourReviewsBlock
              reviews={tour.reviews ?? []}
              avgRating={tour.avgRating}
              reviewsCount={tour.reviewsCount}
            />
          </div>

          {/* Right column — sticky sidebar */}
          <aside>
            <TourBookingSidebar
              tourId={tour.id}
              tourTitle={title}
              tourSlug={tour.slug}
              pricePerPerson={Number(tour.priceUsd)}
              coverImage={tour.coverImage}
              country={tour.country}
              hotelStars={tour.hotelStars}
              durationDays={tour.durationDays}
              roomTypes={tour.roomTypes}
              referralReward={50}
            />
          </aside>
        </div>
      </section>

      {/* Similar tours */}
      <TourSimilar tours={similar} locale={locale} />
    </main>
  );
}

function MetaItem({
  Icon, tone, label, value,
}: { Icon: React.ElementType; tone: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className={`grid place-items-center h-11 w-11 rounded-xl bg-white ring-1 ring-slate-100 ${tone} shrink-0`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="font-bold text-slate-900 text-[15px] truncate">{value}</p>
      </div>
    </div>
  );
}

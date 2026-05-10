import { notFound } from "next/navigation";
import Image from "next/image";
import { Star, Check, X, Calendar, MapPin } from "lucide-react";
import { type Tour, type Review } from "@tours/types";
import { PageWrapper } from "@/src/widgets/layout/page-wrapper";
import { ReviewCard } from "@/src/components/reviews/review-card";
import { BookButton } from "@/src/components/bookings/book-button";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

interface TourDetail extends Tour {
  reviews: Review[];
}

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
  const title = tour.title[lang] ?? tour.title.ru;
  const description = tour.description[lang] ?? tour.description.ru;
  const includedList: string[] = tour.programIncluded[lang] ?? tour.programIncluded.ru ?? [];
  const excludedList: string[] = tour.programExcluded[lang] ?? tour.programExcluded.ru ?? [];

  return (
    <PageWrapper className="py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden mb-6 bg-zinc-100">
            <Image src={tour.coverImage} alt={title || "Tour"} fill className="object-cover" priority />
          </div>

          {tour.images.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-8">
              {tour.images.slice(0, 6).map((img, i) => (
                <div key={i} className="relative aspect-[4/3] rounded-lg overflow-hidden bg-zinc-100">
                  <Image src={img} alt={`${title} ${i + 1}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}

          <h1 className="text-3xl font-bold text-zinc-900 mb-3">{title}</h1>

          <div className="flex items-center gap-4 text-sm text-zinc-600 mb-6">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{[tour.city, tour.country].filter(Boolean).join(", ")}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{tour.durationDays} дней</span>
            </div>
            <div className="flex items-center gap-1 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < tour.hotelStars ? "fill-current" : "text-zinc-300"}`} />
              ))}
            </div>
          </div>

          <p className="text-zinc-700 leading-relaxed mb-8 whitespace-pre-line">{description}</p>

          {includedList.length > 0 && (
            <div className="bg-white rounded-xl border border-zinc-200 p-6 mb-4">
              <h3 className="font-semibold text-zinc-900 mb-3">В стоимость включено</h3>
              <ul className="space-y-2">
                {includedList.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-zinc-700">
                    <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {excludedList.length > 0 && (
            <div className="bg-white rounded-xl border border-zinc-200 p-6 mb-8">
              <h3 className="font-semibold text-zinc-900 mb-3">Не включено</h3>
              <ul className="space-y-2">
                {excludedList.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-zinc-700">
                    <X className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tour.reviews.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-zinc-900 mb-6">
                Отзывы туристов ({tour.reviewsCount})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tour.reviews.map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 sticky top-6 shadow-sm">
            <p className="text-sm text-zinc-500">Цена за человека</p>
            <p className="text-3xl font-bold text-zinc-900 mb-4">${tour.priceUsd}</p>
            <BookButton tourId={tour.id} tourTitle={title || tour.slug} pricePerPerson={Number(tour.priceUsd)} />
            <p className="text-xs text-zinc-500 mt-2 text-center">
              Менеджер свяжется с вами в течение часа.
            </p>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

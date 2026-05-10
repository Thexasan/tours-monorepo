import { getTranslations } from "next-intl/server";
import { Share, ShoppingBag, TrendingUp } from "lucide-react";
import { SearchForm } from "@/src/components/search/search-form";
import { TourCard } from "@/src/components/tours/tour-card";
import { ReviewCard } from "@/src/components/reviews/review-card";
import { type Tour, type Review } from "@tours/types";
import { PageWrapper } from "@/src/widgets/layout/page-wrapper";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export default async function HomePage() {
  const t = await getTranslations("home");

  let hotTours: Tour[] = [];
  try {
    const r = await fetch(`${API_URL}/tours?isHot=true&pageSize=8`, { next: { revalidate: 3600 } });
    if (r.ok) { const d = await r.json(); hotTours = Array.isArray(d) ? d : (d.items ?? []); }
  } catch (e) {
    console.error("Failed to fetch hot tours", e);
  }

  let latestReviews: Review[] = [];
  try {
    const r = await fetch(`${API_URL}/reviews?status=APPROVED&pageSize=6`, { next: { revalidate: 3600 } });
    if (r.ok) { const d = await r.json(); latestReviews = Array.isArray(d) ? d : (d.items ?? []); }
  } catch (e) {
    console.error("Failed to fetch reviews", e);
  }

  return (
    <div className="flex flex-col w-full pb-16">
      <section className="relative w-full h-[500px] flex items-center justify-center bg-zinc-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/60 to-zinc-900/20 z-10" />
        <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop')] bg-cover bg-center" />

        <div className="relative z-20 w-full px-4 max-w-6xl mx-auto flex flex-col items-center text-center mt-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 drop-shadow-md">
            {t("hero.title", { fallback: "Откройте мир с нами" })}
          </h1>
          <p className="text-lg md:text-xl text-zinc-100 mb-10 max-w-2xl drop-shadow-md">
            {t("hero.subtitle", { fallback: "Лучшие туры по самым выгодным ценам с системой кэшбэка" })}
          </p>
          <div className="w-full">
            <SearchForm />
          </div>
        </div>
      </section>

      <PageWrapper className="flex flex-col gap-16 mt-16">
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-900">
              {t("hotTours.title", { fallback: "Горящие туры" })}
            </h2>
          </div>

          {hotTours.length > 0 ? (
            <div className="flex overflow-x-auto md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 pb-4 md:pb-0 snap-x snap-mandatory">
              {hotTours.map((tour) => (
                <div key={tour.id} className="min-w-[80vw] sm:min-w-[300px] md:min-w-0 snap-start">
                  <TourCard tour={tour} />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center bg-white rounded-xl border border-zinc-200">
              <p className="text-zinc-500">{t("hotTours.empty", { fallback: "Сейчас нет горящих туров" })}</p>
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl p-8 md:p-12 border border-zinc-200 shadow-sm">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-zinc-900 mb-12">
            {t("howItWorks.title", { fallback: "Как путешествовать бесплатно?" })}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-6 text-blue-600">
                <Share className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold mb-3">
                {t("howItWorks.step1.title", { fallback: "1. Поделитесь ссылкой" })}
              </h3>
              <p className="text-zinc-600">
                {t("howItWorks.step1.desc", { fallback: "Отправьте вашу реферальную ссылку друзьям и знакомым." })}
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-6 text-amber-600">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold mb-3">
                {t("howItWorks.step2.title", { fallback: "2. Бронирование" })}
              </h3>
              <p className="text-zinc-600">
                {t("howItWorks.step2.desc", { fallback: "Ваш друг бронирует тур на нашей платформе." })}
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-6 text-emerald-600">
                <TrendingUp className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold mb-3">
                {t("howItWorks.step3.title", { fallback: "3. Получите тур" })}
              </h3>
              <p className="text-zinc-600">
                {t("howItWorks.step3.desc", { fallback: "Накопите баллы и отправьтесь в путешествие мечты бесплатно!" })}
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-8 text-center md:text-left">
            {t("reviews.title", { fallback: "Последние отзывы" })}
          </h2>

          {latestReviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center bg-white rounded-xl border border-zinc-200">
              <p className="text-zinc-500">{t("reviews.empty", { fallback: "Пока нет отзывов" })}</p>
            </div>
          )}
        </section>
      </PageWrapper>
    </div>
  );
}

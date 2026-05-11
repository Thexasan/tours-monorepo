import { getTranslations } from "next-intl/server";
import { getLocale } from "next-intl/server";
import Image from "next/image";
import {
  Share2, ShoppingBag, TrendingUp,
  MapPin, Users, Calendar, ChevronRight,
  Star, Globe, Shield, Award, Plane,
  Sparkles, ArrowRight, CheckCircle2, Compass,
  Heart, Clock, Headphones,
} from "lucide-react";
import Link from "next/link";
import { SearchForm } from "@/src/components/search/search-form";
import { TourCard } from "@/src/components/tours/tour-card";
import { ReviewCard } from "@/src/components/reviews/review-card";
import { type Tour, type Review } from "@tours/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

const STATIC_TESTIMONIALS = [
  {
    name: "Алина Коваль",
    city: "Алматы → Бали",
    rating: 5,
    text: "Провела 10 дней на Бали — всё было организовано безупречно. Менеджер ответил на все вопросы за 20 минут. Уже планирую следующий тур!",
    tour: "Бали, Индонезия",
    tone: "teal",
  },
  {
    name: "Дмитрий Петров",
    city: "Москва → Мальдивы",
    rating: 5,
    text: "Благодаря реферальной программе накопил баллы и получил тур на Мальдивы бесплатно. Это просто невероятно — рекомендую всем!",
    tour: "Мальдивы",
    tone: "rose",
  },
  {
    name: "Зарина Бегматова",
    city: "Ташкент → Дубай",
    rating: 5,
    text: "Туристическое агентство с реальными ценами и без скрытых комиссий. Менеджер на связи круглосуточно. Буду возвращаться снова.",
    tour: "Дубай, ОАЭ",
    tone: "amber",
  },
  {
    name: "Марат Исаков",
    city: "Бишкек → Турция",
    rating: 5,
    text: "Отдых в Турции превзошёл все ожидания. Отель 5 звёзд, всё включено, трансфер организован чётко. Спасибо команде!",
    tour: "Анталия, Турция",
    tone: "sky",
  },
] as const;

const TESTIMONIAL_TONES: Record<string, { bg: string; text: string }> = {
  teal: { bg: "from-teal-400 to-emerald-500", text: "text-teal-700" },
  rose: { bg: "from-rose-400 to-orange-500", text: "text-rose-700" },
  amber: { bg: "from-amber-400 to-orange-500", text: "text-amber-700" },
  sky: { bg: "from-sky-400 to-indigo-500", text: "text-sky-700" },
};

const DESTINATIONS = [
  {
    name: "Бали",
    country: "Индонезия",
    tours: 12,
    tag: "Популярное",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80&auto=format&fit=crop",
  },
  {
    name: "Турция",
    country: "Анталия",
    tours: 18,
    tag: "Хит сезона",
    image: "https://images.unsplash.com/photo-1589561253898-768105ca91a8?w=800&q=80&auto=format&fit=crop",
  },
  {
    name: "Дубай",
    country: "ОАЭ",
    tours: 9,
    tag: "Роскошь",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80&auto=format&fit=crop",
  },
  {
    name: "Мальдивы",
    country: "Индийский океан",
    tours: 7,
    tag: "Эксклюзив",
    image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80&auto=format&fit=crop",
  },
  {
    name: "Таиланд",
    country: "Бангкок · Пхукет",
    tours: 14,
    tag: "Экзотика",
    image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&q=80&auto=format&fit=crop",
  },
  {
    name: "Египет",
    country: "Хургада · Шарм",
    tours: 11,
    tag: "Пляж",
    image: "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&q=80&auto=format&fit=crop",
  },
] as const;

export default async function HomePage() {
  const t = await getTranslations("home");
  const locale = await getLocale();

  let hotTours: Tour[] = [];
  try {
    const r = await fetch(`${API_URL}/tours?isHot=true&pageSize=8`, {
      next: { revalidate: 3600 },
    });
    if (r.ok) {
      const d = await r.json();
      hotTours = Array.isArray(d) ? d : (d.items ?? []);
    }
  } catch { /* silent */ }

  let latestReviews: Review[] = [];
  try {
    const r = await fetch(`${API_URL}/reviews?status=APPROVED&pageSize=4`, {
      next: { revalidate: 3600 },
    });
    if (r.ok) {
      const d = await r.json();
      latestReviews = Array.isArray(d) ? d : (d.items ?? []);
    }
  } catch { /* silent */ }

  return (
    <div className="flex flex-col w-full bg-white">

      {/* ───── HERO ───── */}
      <section className="relative overflow-hidden">
        {/* Soft mesh background */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(900px 500px at 8% 0%, rgba(20,184,166,0.18), transparent 60%)," +
              "radial-gradient(700px 500px at 100% 10%, rgba(244,63,94,0.14), transparent 55%)," +
              "radial-gradient(500px 400px at 50% 100%, rgba(245,158,11,0.10), transparent 60%)," +
              "linear-gradient(180deg, #fafcff 0%, #ffffff 70%)",
          }}
        />
        {/* Dot grid */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(15,23,42,0.06) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            maskImage: "radial-gradient(ellipse at center, black 50%, transparent 90%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 50%, transparent 90%)",
          }}
        />

        <div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 pt-12 md:pt-20 pb-16 md:pb-28">
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-16 items-center">
            {/* Left: text */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold bg-white ring-1 ring-teal-200 text-teal-700 shadow-[0_4px_12px_-2px_rgba(13,148,136,0.18)]">
                <Sparkles className="h-3.5 w-3.5" />
                Реферальная программа — путешествуй бесплатно
              </div>

              <h1 className="mt-6 text-[44px] sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-[-0.02em] text-slate-900 leading-[1.05]">
                Открой мир
                <br />
                <span className="relative inline-block">
                  <span
                    className="relative z-10"
                    style={{
                      background:
                        "linear-gradient(135deg, #f97316 0%, #f43f5e 35%, #0d9488 75%, #0284c7 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    по-новому
                  </span>
                  <svg
                    aria-hidden
                    className="absolute -bottom-2 left-0 w-full"
                    height="14"
                    viewBox="0 0 300 14"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M2 8 Q 75 1, 150 6 T 298 4"
                      stroke="url(#hl)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <defs>
                      <linearGradient id="hl" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#f97316" />
                        <stop offset="50%" stopColor="#f43f5e" />
                        <stop offset="100%" stopColor="#0d9488" />
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
              </h1>

              <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-xl">
                Бронируй лучшие туры, приглашай друзей и путешествуй бесплатно — или зарабатывай 5% с каждой продажи как партнёр.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-600">
                <Stat label="Путешественников" value="12 000+" />
                <span className="h-4 w-px bg-slate-200" aria-hidden />
                <Stat label="Направлений" value="50+" />
                <span className="h-4 w-px bg-slate-200" aria-hidden />
                <Stat label="Рейтинг" value="4.9★" />
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href={`/${locale}/tours`}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-b from-teal-500 to-teal-600 text-white font-semibold text-[15px] shadow-[0_10px_24px_-8px_rgba(13,148,136,0.55)] hover:-translate-y-0.5 transition-all"
                >
                  Смотреть туры
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={`/${locale}/become-partner`}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-slate-800 font-semibold text-[15px] border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
                >
                  Стать партнёром
                </Link>
              </div>
            </div>

            {/* Right: photo collage */}
            <div className="relative h-[440px] md:h-[520px] hidden lg:block">
              {/* Main photo */}
              <div className="absolute top-0 right-0 w-[68%] h-[78%] rounded-3xl overflow-hidden shadow-[0_30px_60px_-20px_rgba(15,23,42,0.35)] ring-1 ring-white/40">
                <Image
                  src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=85&auto=format&fit=crop"
                  alt="Travel"
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 0px, 600px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                {/* Floating place tag */}
                <div className="absolute bottom-5 left-5 inline-flex items-center gap-2 rounded-full bg-white/95 backdrop-blur px-4 py-2 text-sm font-semibold text-slate-900 shadow-md">
                  <MapPin className="h-4 w-4 text-rose-500" />
                  Бали, Индонезия
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  4.9
                </div>
              </div>

              {/* Secondary photo */}
              <div className="absolute bottom-0 left-0 w-[58%] h-[55%] rounded-3xl overflow-hidden shadow-[0_24px_50px_-16px_rgba(15,23,42,0.35)] ring-4 ring-white">
                <Image
                  src="https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=900&q=85&auto=format&fit=crop"
                  alt="Beach"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 0px, 480px"
                />
              </div>

              {/* Floating mini-card */}
              <div className="absolute top-[8%] left-[2%] bg-white rounded-2xl p-3 pr-5 shadow-[0_18px_36px_-12px_rgba(15,23,42,0.30)] ring-1 ring-slate-100 flex items-center gap-3 max-w-[230px]">
                <div className="grid place-items-center h-11 w-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[0_8px_16px_-6px_rgba(245,158,11,0.55)]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Доступно
                  </p>
                  <p className="text-sm font-bold text-slate-900 leading-tight">
                    1 бесплатный тур
                  </p>
                </div>
              </div>

              {/* Floating users-card */}
              <div className="absolute bottom-[2%] right-[2%] bg-white rounded-2xl p-3 pr-4 shadow-[0_18px_36px_-12px_rgba(15,23,42,0.30)] ring-1 ring-slate-100 flex items-center gap-2.5">
                <div className="flex -space-x-2.5">
                  {[
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&q=80&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80&auto=format&fit=crop",
                  ].map((src) => (
                    <div key={src} className="relative h-8 w-8 rounded-full ring-2 ring-white overflow-hidden bg-slate-100">
                      <Image src={src} alt="" fill className="object-cover" sizes="32px" />
                    </div>
                  ))}
                </div>
                <p className="text-xs font-semibold text-slate-700 leading-tight">
                  +12k <br />
                  <span className="text-slate-400 font-normal">путешественников</span>
                </p>
              </div>
            </div>
          </div>

          {/* Search form */}
          <div className="mt-10 md:mt-14">
            <SearchForm />
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400 mr-1">
                Популярные:
              </span>
              {["Бали", "Турция", "Дубай", "Мальдивы", "Таиланд", "Египет"].map((dest) => (
                <Link
                  key={dest}
                  href={`/${locale}/tours?search=${dest}`}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 bg-white ring-1 ring-slate-200 hover:ring-teal-300 hover:text-teal-700 hover:bg-teal-50 transition-all"
                >
                  {dest}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───── TRUST FEATURES ───── */}
      <section className="border-y border-slate-100 bg-gradient-to-b from-white to-slate-50/50">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 py-10 md:py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { icon: Shield, title: "Безопасные платежи", text: "Защищённые транзакции и возврат", tone: "teal" },
              { icon: Headphones, title: "24/7 поддержка", text: "Менеджер всегда на связи", tone: "rose" },
              { icon: Award, title: "Лучшие цены", text: "Без скрытых комиссий", tone: "amber" },
              { icon: Heart, title: "12 000+ клиентов", text: "Доверяют нам с 2020 года", tone: "sky" },
            ].map((it) => (
              <Feature key={it.title} {...(it as { icon: React.ElementType; title: string; text: string; tone: "teal" | "rose" | "amber" | "sky" })} />
            ))}
          </div>
        </div>
      </section>

      {/* ───── DESTINATIONS ───── */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 py-20 md:py-28">
          <SectionHeader
            eyebrow="Направления"
            title="Куда полетим?"
            description="Топ-направлений сезона — реальные фото и проверенные отели"
            action={
              <Link
                href={`/${locale}/tours`}
                className="hidden md:inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-800"
              >
                Все направления <ChevronRight className="w-4 h-4" />
              </Link>
            }
          />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mt-10">
            {DESTINATIONS.map((dest, idx) => (
              <Link
                key={dest.name}
                href={`/${locale}/tours?search=${dest.name}`}
                className={`group relative overflow-hidden rounded-3xl ring-1 ring-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_40px_-20px_rgba(15,23,42,0.25)] hover:shadow-[0_4px_8px_rgba(15,23,42,0.05),0_24px_50px_-12px_rgba(15,23,42,0.3)] transition-all duration-300 hover:-translate-y-1 ${
                  idx === 0 ? "md:col-span-2 md:row-span-2 md:aspect-auto aspect-[4/3]" : "aspect-[4/3]"
                }`}
              >
                <Image
                  src={dest.image}
                  alt={dest.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes={idx === 0 ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 33vw"}
                />
                {/* Bottom gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                {/* Tag */}
                <div className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur px-2.5 py-1 text-[11px] font-bold text-slate-900 shadow-sm">
                  {dest.tag}
                </div>
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 text-white">
                  <h3 className={`font-bold leading-tight tracking-tight ${idx === 0 ? "text-3xl md:text-4xl" : "text-xl md:text-2xl"}`}>
                    {dest.name}
                  </h3>
                  <p className="mt-1 text-white/80 text-sm flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {dest.country}
                    <span className="h-1 w-1 rounded-full bg-white/40 mx-1.5" />
                    {dest.tours} туров
                  </p>
                </div>
                {/* Hover arrow */}
                <div className="absolute top-4 left-4 grid place-items-center h-10 w-10 rounded-full bg-white/95 backdrop-blur translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <ArrowRight className="h-4 w-4 text-teal-700" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ───── HOT TOURS ───── */}
      {hotTours.length > 0 && (
        <section className="bg-gradient-to-b from-slate-50 to-white">
          <div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 py-20 md:py-24">
            <SectionHeader
              eyebrow={t("hotTours.title", { fallback: "Горящие туры" })}
              title="Лучшие предложения сезона"
              description="Туры с самой высокой скидкой — успейте забронировать"
              accent="rose"
              action={
                <Link
                  href={`/${locale}/tours`}
                  className="hidden md:inline-flex items-center gap-1 text-sm font-semibold text-rose-600 hover:text-rose-700"
                >
                  Все туры <ChevronRight className="w-4 h-4" />
                </Link>
              }
            />

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {hotTours.slice(0, 8).map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>

            <div className="mt-8 flex justify-center md:hidden">
              <Link
                href={`/${locale}/tours`}
                className="inline-flex items-center gap-1 text-sm font-semibold text-rose-600 hover:text-rose-700"
              >
                Смотреть все туры <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ───── HOW IT WORKS ───── */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 py-20 md:py-28">
          <SectionHeader
            eyebrow="Как это работает"
            title="Путешествуй — и получай"
            description="Наша реферальная система — три простых шага до бесплатной поездки"
            center
          />

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connector line */}
            <div
              aria-hidden
              className="hidden md:block absolute top-[44px] left-[calc(16.7%+40px)] right-[calc(16.7%+40px)] h-px"
              style={{
                background:
                  "linear-gradient(to right, rgba(244,63,94,0.4) 0%, rgba(245,158,11,0.4) 50%, rgba(13,148,136,0.4) 100%)",
              }}
            />

            {[
              {
                step: "01",
                icon: Share2,
                title: "Поделитесь ссылкой",
                desc: "Получите персональную реферальную ссылку и отправьте её друзьям.",
                grad: "from-rose-500 to-orange-500",
                glow: "rgba(244,63,94,0.4)",
              },
              {
                step: "02",
                icon: ShoppingBag,
                title: "Друг бронирует тур",
                desc: "Когда друг оплачивает тур по вашей ссылке — засчитывается один реферал.",
                grad: "from-amber-400 to-orange-500",
                glow: "rgba(245,158,11,0.45)",
              },
              {
                step: "03",
                icon: TrendingUp,
                title: "Получите бесплатный тур",
                desc: "Накопите 50 рефералов и выберите любой тур из каталога совершенно бесплатно.",
                grad: "from-teal-500 to-emerald-600",
                glow: "rgba(13,148,136,0.45)",
              },
            ].map(({ step, icon: Icon, title, desc, grad, glow }) => (
              <div
                key={step}
                className="relative rounded-3xl bg-white p-7 md:p-8 ring-1 ring-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.18)] hover:shadow-[0_4px_8px_rgba(15,23,42,0.05),0_24px_48px_-16px_rgba(15,23,42,0.25)] hover:-translate-y-1 transition-all duration-300"
              >
                <span
                  aria-hidden
                  className="absolute top-4 right-5 text-7xl font-black text-slate-50 select-none"
                >
                  {step}
                </span>
                <div
                  className={`relative z-10 grid place-items-center h-14 w-14 rounded-2xl bg-gradient-to-br ${grad} text-white mb-5`}
                  style={{ boxShadow: `0 12px 24px -8px ${glow}` }}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 leading-snug">{title}</h3>
                <p className="mt-2 text-[15px] text-slate-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── TRIP PLANNER ───── */}
      <section className="bg-gradient-to-b from-white to-slate-50">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 py-20 md:py-28">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
                Планировщик поездки
              </p>
              <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight text-slate-900 leading-[1.05]">
                Спланируй свой
                <br />
                <span
                  style={{
                    background: "linear-gradient(135deg, #f59e0b, #f97316)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  идеальный маршрут
                </span>
              </h2>
              <p className="mt-5 text-lg text-slate-600 leading-relaxed max-w-lg">
                Укажи направление, даты и количество гостей. Мы подберём лучшие варианты и свяжем с персональным менеджером в течение 20 минут.
              </p>

              <ul className="mt-8 space-y-3">
                {[
                  { text: "50+ направлений по всему миру", color: "text-rose-500" },
                  { text: "Гибкие даты и индивидуальные маршруты", color: "text-teal-600" },
                  { text: "Туры для семей, пар и групп", color: "text-amber-500" },
                  { text: "Менеджер на связи 24/7", color: "text-sky-600" },
                ].map(({ text, color }) => (
                  <li key={text} className="flex items-start gap-3 text-slate-700">
                    <CheckCircle2 className={`mt-0.5 h-5 w-5 shrink-0 ${color}`} />
                    <span className="text-[15px]">{text}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={`/${locale}/tours`}
                className="mt-9 inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-b from-teal-500 to-teal-600 text-white font-semibold shadow-[0_10px_24px_-8px_rgba(13,148,136,0.55)] hover:-translate-y-0.5 transition-all"
              >
                Подобрать маршрут
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Right: booking preview card */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-teal-100 via-sky-100 to-rose-100 opacity-60 blur-2xl -z-10" aria-hidden />
              <div className="rounded-3xl bg-white p-2 ring-1 ring-slate-100 shadow-[0_30px_60px_-20px_rgba(15,23,42,0.25)]">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900">Быстрое бронирование</p>
                  <div className="flex gap-1.5" aria-hidden>
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-teal-400" />
                  </div>
                </div>

                <div className="p-4 space-y-2.5">
                  {[
                    { icon: MapPin, label: "Направление", value: "Бали, Индонезия", tone: "bg-rose-50 text-rose-600 ring-rose-100" },
                    { icon: Calendar, label: "Даты вылета", value: "15 авг — 25 авг · 10 ночей", tone: "bg-teal-50 text-teal-600 ring-teal-100" },
                    { icon: Users, label: "Путешественники", value: "2 взрослых · 1 ребёнок", tone: "bg-amber-50 text-amber-600 ring-amber-100" },
                    { icon: Star, label: "Отель", value: "5★ · All inclusive", tone: "bg-sky-50 text-sky-600 ring-sky-100" },
                  ].map(({ icon: Icon, label, value, tone }) => (
                    <div
                      key={label}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-white hover:ring-1 hover:ring-slate-200 transition-all"
                    >
                      <div className={`grid place-items-center h-10 w-10 rounded-xl ring-1 ${tone}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">{label}</p>
                        <p className="text-sm font-semibold text-slate-900 truncate">{value}</p>
                      </div>
                    </div>
                  ))}

                  <div
                    className="flex items-center justify-between p-3.5 rounded-xl mt-2 text-white"
                    style={{
                      background:
                        "linear-gradient(135deg, #0d9488 0%, #0284c7 100%)",
                      boxShadow: "0 12px 24px -10px rgba(13,148,136,0.55)",
                    }}
                  >
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-white/70 font-semibold">
                        Примерная стоимость
                      </p>
                      <p className="text-xs text-white/70">на 3 человека</p>
                    </div>
                    <p className="text-2xl font-bold tabular-nums">от $2 460</p>
                  </div>

                  <Link
                    href={`/${locale}/tours`}
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold text-white transition-all hover:-translate-y-0.5"
                    style={{
                      background: "linear-gradient(135deg, #f97316, #f43f5e)",
                      boxShadow: "0 12px 24px -10px rgba(244,63,94,0.5)",
                    }}
                  >
                    Спланировать поездку
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── TESTIMONIALS ───── */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 py-20 md:py-28">
          <SectionHeader
            eyebrow={t("reviews.title", { fallback: "Отзывы" })}
            title="Что говорят наши клиенты"
            description="Более 12 000 путешественников уже выбрали нас"
            center
            accent="amber"
          />

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {latestReviews.length > 0
              ? latestReviews.slice(0, 4).map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))
              : STATIC_TESTIMONIALS.map((tm) => {
                  const tone = TESTIMONIAL_TONES[tm.tone];
                  return (
                    <article
                      key={tm.name}
                      className="relative h-full flex flex-col rounded-2xl bg-white p-6 ring-1 ring-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.18)] hover:shadow-[0_4px_8px_rgba(15,23,42,0.05),0_18px_36px_-12px_rgba(15,23,42,0.22)] hover:-translate-y-1 transition-all duration-300"
                    >
                      <div className="flex items-center gap-1 mb-3">
                        {Array.from({ length: tm.rating }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <p className="text-[15px] text-slate-700 leading-relaxed flex-grow mb-5">
                        «{tm.text}»
                      </p>
                      <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                        <div className={`grid place-items-center h-11 w-11 rounded-full bg-gradient-to-br ${tone?.bg ?? "from-teal-400 to-sky-500"} text-white font-bold ring-2 ring-white shadow-sm`}>
                          {tm.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-slate-900 truncate">{tm.name}</p>
                          <p className="text-xs text-slate-500 truncate">{tm.city}</p>
                        </div>
                      </div>
                      <div className={`mt-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold w-fit bg-slate-50 ${tone?.text ?? "text-teal-700"}`}>
                        <MapPin className="h-3 w-3" />
                        {tm.tour}
                      </div>
                    </article>
                  );
                })}
          </div>
        </div>
      </section>

      {/* ───── DUAL CTA ───── */}
      <section className="bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 py-20 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Partner CTA */}
            <div className="relative overflow-hidden rounded-3xl p-8 md:p-10 text-white"
              style={{
                background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
                boxShadow: "0 30px 60px -20px rgba(244,63,94,0.45)",
              }}
            >
              <div
                aria-hidden
                className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/15 blur-3xl"
              />
              <div className="relative">
                <div className="grid place-items-center h-12 w-12 rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <p className="mt-5 text-xs uppercase tracking-[0.14em] font-bold text-white/90">
                  Для блогеров и агентов
                </p>
                <h3 className="mt-2 text-3xl md:text-4xl font-bold leading-tight tracking-tight">
                  Станьте партнёром
                </h3>
                <p className="mt-3 text-white/90 leading-relaxed max-w-md">
                  Зарабатывайте 5% с каждой продажи. Подключите свою аудиторию и получайте стабильный доход с путешествий.
                </p>
                <Link
                  href={`/${locale}/become-partner`}
                  className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-rose-600 font-bold text-sm hover:-translate-y-0.5 transition-all"
                >
                  Подать заявку
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Free tour CTA */}
            <div className="relative overflow-hidden rounded-3xl p-8 md:p-10 text-white"
              style={{
                background: "linear-gradient(135deg, #0d9488 0%, #0284c7 60%, #1e3a8a 100%)",
                boxShadow: "0 30px 60px -20px rgba(13,148,136,0.45)",
              }}
            >
              <div
                aria-hidden
                className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white/15 blur-3xl"
              />
              <div className="relative">
                <div className="grid place-items-center h-12 w-12 rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <p className="mt-5 text-xs uppercase tracking-[0.14em] font-bold text-white/90">
                  Для путешественников
                </p>
                <h3 className="mt-2 text-3xl md:text-4xl font-bold leading-tight tracking-tight">
                  Бесплатный тур
                </h3>
                <p className="mt-3 text-white/90 leading-relaxed max-w-md">
                  Пригласите 50 друзей по реферальной ссылке и выберите любой тур из каталога совершенно бесплатно.
                </p>
                <Link
                  href={`/${locale}/dashboard/referrals`}
                  className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-teal-700 font-bold text-sm hover:-translate-y-0.5 transition-all"
                >
                  Получить ссылку
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── FINAL CTA ───── */}
      <section className="relative overflow-hidden bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 py-24 md:py-32">
          <div className="relative rounded-[2rem] overflow-hidden ring-1 ring-slate-100 shadow-[0_30px_60px_-20px_rgba(15,23,42,0.3)]">
            <Image
              src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1600&q=85&auto=format&fit=crop"
              alt="Travel"
              fill
              sizes="100vw"
              className="object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(13,148,136,0.92) 0%, rgba(2,132,199,0.88) 50%, rgba(30,58,138,0.92) 100%)",
              }}
            />

            <div className="relative z-10 px-8 md:px-16 py-20 md:py-28 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/80">
                Начни сейчас
              </p>
              <h2 className="mt-3 text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight text-white">
                Твоё следующее
                <br />
                <span
                  style={{
                    background: "linear-gradient(135deg, #fde68a, #fb923c, #f43f5e)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  приключение ждёт
                </span>
              </h2>
              <p className="mt-5 text-lg text-white/85 max-w-xl mx-auto leading-relaxed">
                Более 12 000 путешественников уже выбрали нас. Зарегистрируйтесь и начните зарабатывать реферальные баллы с первой же поездки.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href={`/${locale}/register`}
                  className="px-7 py-4 rounded-xl font-bold text-base bg-white text-teal-700 hover:-translate-y-0.5 transition-all shadow-[0_12px_24px_-8px_rgba(0,0,0,0.3)]"
                >
                  Зарегистрироваться бесплатно
                </Link>
                <Link
                  href={`/${locale}/tours`}
                  className="px-7 py-4 rounded-xl font-bold text-base text-white bg-white/10 backdrop-blur ring-1 ring-white/30 hover:bg-white/20 transition-colors"
                >
                  Смотреть туры
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ───────── Helpers ───────── */

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-lg font-bold text-slate-900 tabular-nums">{value}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </span>
  );
}

function Feature({
  icon: Icon, title, text, tone,
}: {
  icon: React.ElementType;
  title: string;
  text: string;
  tone: "teal" | "rose" | "amber" | "sky";
}) {
  const toneCls: Record<typeof tone, string> = {
    teal: "from-teal-500 to-teal-600",
    rose: "from-rose-500 to-rose-600",
    amber: "from-amber-400 to-amber-500",
    sky: "from-sky-500 to-sky-600",
  };
  return (
    <div className="flex items-start gap-3">
      <div className={`grid place-items-center h-11 w-11 rounded-2xl bg-gradient-to-br ${toneCls[tone]} text-white shadow-[0_8px_18px_-8px_rgba(15,23,42,0.25)] shrink-0`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-semibold text-slate-900 text-[15px]">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  center,
  accent = "teal",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  center?: boolean;
  accent?: "teal" | "rose" | "amber";
}) {
  const accentCls: Record<typeof accent, string> = {
    teal: "text-teal-700",
    rose: "text-rose-600",
    amber: "text-amber-600",
  };
  return (
    <div className={`flex flex-col md:flex-row md:items-end gap-4 ${center ? "md:flex-col md:items-center text-center" : "md:justify-between"}`}>
      <div className={center ? "max-w-2xl mx-auto" : ""}>
        <p className={`text-xs font-bold uppercase tracking-[0.16em] ${accentCls[accent]}`}>
          {eyebrow}
        </p>
        <h2 className="mt-2 text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-[1.05]">
          {title}
        </h2>
        {description && (
          <p className="mt-3 text-lg text-slate-500 leading-relaxed">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

import { getTranslations } from "next-intl/server";
import { getLocale } from "next-intl/server";
import Image from "next/image";
import {
  Share2, ShoppingBag, TrendingUp,
  MapPin, Users, Calendar, ChevronRight,
  Star, Shield, Award,
  Sparkles, ArrowRight, CheckCircle2,
  Heart, Headphones, ChevronDown,
  MessageCircle, Send, Clock, Flame,
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
    countryEn: "Bali",
    tours: 12,
    tag: "Популярное",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80&auto=format&fit=crop",
  },
  {
    name: "Турция",
    country: "Анталия",
    countryEn: "Turkey",
    tours: 18,
    tag: "Хит сезона",
    image: "https://images.unsplash.com/photo-1589561253898-768105ca91a8?w=800&q=80&auto=format&fit=crop",
  },
  {
    name: "Дубай",
    country: "ОАЭ",
    countryEn: "UAE",
    tours: 9,
    tag: "Роскошь",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80&auto=format&fit=crop",
  },
  {
    name: "Мальдивы",
    country: "Индийский океан",
    countryEn: "Maldives",
    tours: 7,
    tag: "Эксклюзив",
    image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80&auto=format&fit=crop",
  },
  {
    name: "Таиланд",
    country: "Бангкок · Пхукет",
    countryEn: "Thailand",
    tours: 14,
    tag: "Экзотика",
    image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&q=80&auto=format&fit=crop",
  },
  {
    name: "Египет",
    country: "Хургада · Шарм",
    countryEn: "Egypt",
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

      {/* ───── HERO — Cinematic Full-bleed ───── */}
      <section className="relative -mt-16 h-[90vh] min-h-[600px] overflow-hidden">

        {/* 3 crossfading background photos */}
        {[
          "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=2000&q=85&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=2000&q=85&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=2000&q=85&auto=format&fit=crop",
        ].map((src, i) => (
          <div
            key={src}
            className="hero-photo absolute inset-0"
            style={{ animationDelay: `${i * 6}s` }}
          >
            <Image
              src={src}
              alt=""
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover"
            />
          </div>
        ))}

        {/* Dark gradient — bottom-heavy for text legibility */}
        <div aria-hidden className="absolute inset-0 bg-linear-to-t from-black/72 via-black/30 to-black/5" />

        {/* Subtle vignette for premium cinematic feel */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.28) 100%)" }}
        />

        {/* Content — pinned to bottom of hero */}
        <div className="relative z-10 h-full flex flex-col justify-end pb-10 md:pb-16">
          <div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8">

            {/* Headline */}
            <h1
              className="font-black text-white leading-[0.9] tracking-[-0.03em] drop-shadow-[0_4px_28px_rgba(0,0,0,0.45)]"
              style={{ fontSize: "clamp(52px, 10vw, 130px)" }}
            >
              Открой мир
              <br />
              по-новому.
            </h1>

            {/* Subtitle */}
            <p className="mt-5 text-base md:text-lg text-white/75 max-w-lg leading-relaxed">
              Лучшие туры по честным ценам — и реальный шанс путешествовать бесплатно. Тысячи туристов уже в пути.
            </p>

            {/* Stats */}
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1 text-white/60 text-sm font-medium">
              <span>50+ направлений</span>
              <span aria-hidden className="text-white/25">·</span>
              <span>4.9★ рейтинг</span>
              <span aria-hidden className="text-white/25">·</span>
              <span>12 000+ путешественников</span>
            </div>

            {/* Search */}
            <div className="mt-7 md:mt-8">
              <SearchForm />
            </div>

            {/* Popular tags */}
            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <span className="text-xs text-white/45 mr-1">Популярные:</span>
              {["Бали", "Турция", "Дубай", "Мальдивы", "Таиланд", "Египет"].map((dest) => (
                <Link
                  key={dest}
                  href={`/${locale}/tours?country=${DESTINATIONS.find(d => d.name === dest)?.countryEn ?? dest}&q=${encodeURIComponent(dest)}`}
                  className="px-3 py-1.5 rounded-full text-xs text-white/80 bg-white/10 ring-1 ring-white/20 hover:bg-white/20 hover:text-white transition-all"
                >
                  {dest}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          aria-hidden
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center text-white/35 animate-bounce"
        >
          <ChevronDown className="h-5 w-5" />
        </div>
      </section>

      {/* ───── TRUST FEATURES ───── */}
      <section className="bg-white border-y border-slate-100">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {([
              {
                icon: Shield,
                title: "Ваши деньги в безопасности",
                text: "Защищённые платежи и полный возврат при отмене. Мы несём ответственность за каждую транзакцию.",
                stat: "Возврат без вопросов",
                tone: "teal",
              },
              {
                icon: Headphones,
                title: "Всегда рядом — 24/7",
                text: "Менеджер ответит в WhatsApp, Telegram или по телефону в любое время суток.",
                stat: "Ответ за 20 минут",
                tone: "rose",
              },
              {
                icon: Award,
                title: "Гарантия лучшей цены",
                text: "Нашли дешевле? Снизим цену или вернём разницу. Ноль скрытых комиссий и сборов.",
                stat: "0 скрытых платежей",
                tone: "amber",
              },
              {
                icon: Heart,
                title: "12 000+ счастливых клиентов",
                text: "С 2020 года создаём поездки мечты. Каждый второй клиент возвращается снова.",
                stat: "Рейтинг 4.9 из 5",
                tone: "sky",
              },
            ] as const).map((it) => (
              <Feature key={it.title} {...it} />
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
                href={`/${locale}/tours?country=${dest.countryEn}&q=${encodeURIComponent(dest.name)}`}
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
                <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent" />
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
        <section className="bg-white">
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

            {/* ── Bento top row: 1 hero + 2 stacked ── */}
            <div
              className="mt-10 grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-5"
              style={{ gridTemplateRows: "repeat(2, 220px)" }}
            >
              {/* Hero card — spans 2 cols × 2 rows */}
              <div className="md:col-span-2 md:row-span-2 h-[320px] md:h-auto">
                <TourCard tour={hotTours[0]} variant="overlay" featured />
              </div>

              {/* Two small overlay cards stacked in right column */}
              {hotTours.slice(1, 3).map((tour) => (
                <div key={tour.id} className="h-[220px] md:h-auto">
                  <TourCard tour={tour} variant="overlay" />
                </div>
              ))}
            </div>

            {/* ── Bottom row: regular default cards ── */}
            {hotTours.length > 3 && (
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {hotTours.slice(3, 6).map((tour) => (
                  <TourCard key={tour.id} tour={tour} />
                ))}
              </div>
            )}

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
                  className={`relative z-10 grid place-items-center h-14 w-14 rounded-2xl bg-linear-to-br ${grad} text-white mb-5`}
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
      <section className="bg-linear-to-b from-white to-slate-50">
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
                className="mt-9 inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-linear-to-b from-teal-500 to-teal-600 text-white font-semibold shadow-[0_10px_24px_-8px_rgba(13,148,136,0.55)] hover:-translate-y-0.5 transition-all"
              >
                Подобрать маршрут
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Right: booking preview card */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-[2.5rem] bg-linear-to-br from-teal-100 via-sky-100 to-rose-100 opacity-60 blur-2xl -z-10" aria-hidden />
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
            eyebrow={t("reviews.title", { fallback: "Последние отзывы" })}
            title="Что говорят наши клиенты"
            description="Более 12 000 путешественников уже выбрали нас"
            center
            accent="amber"
          />

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestReviews.length > 0
              ? latestReviews.slice(0, 3).map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))
              : STATIC_TESTIMONIALS.slice(0, 3).map((tm) => {
                  const tone = TESTIMONIAL_TONES[tm.tone];
                  return (
                    <article
                      key={tm.name}
                      className="relative h-full flex flex-col rounded-2xl bg-white p-6 ring-1 ring-slate-100 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_10px_28px_-14px_rgba(15,23,42,0.14)] hover:shadow-[0_4px_8px_rgba(15,23,42,0.04),0_20px_44px_-12px_rgba(13,148,136,0.16)] hover:-translate-y-1.5 transition-all duration-300"
                    >
                      {/* Decorative quote */}
                      <span aria-hidden className="absolute top-3 right-4 text-[80px] font-black leading-none select-none pointer-events-none text-teal-100">"</span>

                      {/* Stars */}
                      <div className="flex items-center gap-1.5 mb-4 relative z-10">
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${i < tm.rating ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-200"}`} />
                          ))}
                        </div>
                        <span className="text-[12px] font-bold text-amber-600 ml-0.5">{tm.rating}.0</span>
                      </div>

                      {/* Text */}
                      <p className="text-[15px] italic text-slate-700 leading-[1.75] flex-grow mb-5 relative z-10">
                        «{tm.text}»
                      </p>

                      {/* Author */}
                      <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                        <div className={`grid place-items-center h-10 w-10 rounded-full bg-linear-to-br ${tone?.bg ?? "from-teal-400 to-sky-500"} text-white font-bold text-sm ring-2 ring-teal-100 shadow-sm shrink-0`}>
                          {tm.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-[13px] text-slate-900 truncate">{tm.name}</p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                            <MapPin className="h-3 w-3 text-teal-500 shrink-0" />
                            {tm.tour}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
          </div>
        </div>
      </section>

      {/* ───── DUAL CTA ───── */}
      <section className="bg-linear-to-b from-slate-50 to-white">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 py-20 md:py-24">
          <div
            className="relative overflow-hidden rounded-3xl ring-1 ring-teal-100"
            style={{
              background: "linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 45%, #fef9ee 100%)",
              boxShadow: "0 20px 60px -16px rgba(13,148,136,0.14), 0 4px 12px -4px rgba(15,23,42,0.06)",
            }}
          >
            {/* Soft glow accents */}
            <div aria-hidden className="absolute -top-20 -left-20 w-80 h-80 rounded-full blur-3xl pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(13,148,136,0.12), transparent 70%)" }} />
            <div aria-hidden className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full blur-3xl pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(245,158,11,0.10), transparent 70%)" }} />

            <div className="relative grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-teal-100">

              {/* ── Left: Chat CTA ── */}
              <div className="p-8 md:p-10 lg:p-12 flex flex-col">
                <div
                  className="self-start grid place-items-center h-12 w-12 rounded-2xl mb-5"
                  style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)", boxShadow: "0 8px 24px -8px rgba(245,158,11,0.45)" }}
                >
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>

                <div className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full bg-white/80 ring-1 ring-teal-200 text-slate-600 text-xs font-semibold mb-4 shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative h-2 w-2 rounded-full bg-green-500" />
                  </span>
                  Онлайн · ответим за 20 мин
                </div>

                <h3 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight text-slate-900">
                  Подберём тур
                  <br />прямо в чате
                </h3>
                <p className="mt-3 text-slate-500 leading-relaxed text-[15px]">
                  Напишите — менеджер найдёт лучшее предложение под ваш бюджет и даты без форм и ожидания.
                </p>

                {/* Mini chat */}
                <div className="mt-6 space-y-2.5 p-4 rounded-2xl bg-white/70 ring-1 ring-slate-100 shadow-sm">
                  <div className="flex justify-end">
                    <div className="rounded-2xl rounded-tr-sm px-3.5 py-2 max-w-[85%]"
                      style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)" }}>
                      <p className="text-white text-[13px] font-medium leading-snug">Хочу на Бали, бюджет $1500 на двоих 🌴</p>
                    </div>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="h-7 w-7 rounded-full bg-teal-100 grid place-items-center shrink-0">
                      <Headphones className="h-3.5 w-3.5 text-teal-600" />
                    </div>
                    <div className="rounded-2xl rounded-bl-sm px-3.5 py-2.5 max-w-[80%] bg-slate-100 ring-1 ring-slate-200">
                      <p className="text-slate-700 text-[13px] leading-snug">Нашла 3 варианта! Лучший — 10 ночей от $1 340 ✈️</p>
                    </div>
                  </div>
                  <div className="flex justify-center pt-0.5">
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                      <Clock className="h-3 w-3" />
                      ответ за 4 минуты
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="https://wa.me/992000000000"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white hover:-translate-y-0.5 transition-all"
                    style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)", boxShadow: "0 8px 20px -6px rgba(245,158,11,0.4)" }}
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                  <a
                    href="https://t.me/traveling_tours"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white ring-1 ring-slate-200 text-slate-700 font-bold text-sm hover:ring-teal-300 hover:text-teal-700 transition-all shadow-sm"
                  >
                    <Send className="h-4 w-4" />
                    Telegram
                  </a>
                </div>
              </div>

              {/* ── Right: Free tour CTA ── */}
              <div className="p-8 md:p-10 lg:p-12 flex flex-col">
                <div
                  className="self-start grid place-items-center h-12 w-12 rounded-2xl mb-5"
                  style={{ background: "linear-gradient(135deg, #0d9488, #0284c7)", boxShadow: "0 8px 24px -8px rgba(13,148,136,0.45)" }}
                >
                  <Sparkles className="h-6 w-6 text-white" />
                </div>

                <p className="text-xs uppercase tracking-[0.14em] font-bold text-teal-600 mb-4">
                  Для путешественников
                </p>

                <h3 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight text-slate-900">
                  Бесплатный тур
                </h3>
                <p className="mt-3 text-slate-500 leading-relaxed text-[15px]">
                  Пригласите 50 друзей по реферальной ссылке и выберите любой тур из каталога совершенно бесплатно.
                </p>

                <ul className="mt-7 space-y-3.5 flex-1">
                  {([
                    { icon: Share2,     text: "Получите персональную реферальную ссылку", bg: "bg-amber-50  ring-amber-100",  ic: "text-amber-500" },
                    { icon: Users,      text: "Друзья бронируют туры по вашей ссылке",    bg: "bg-teal-50  ring-teal-100",   ic: "text-teal-600"  },
                    { icon: TrendingUp, text: "50 рефералов — любой тур бесплатно",       bg: "bg-sky-50   ring-sky-100",    ic: "text-sky-600"   },
                  ] as const).map(({ icon: Icon, text, bg, ic }) => (
                    <li key={text} className="flex items-center gap-3.5">
                      <div className={`h-9 w-9 rounded-xl grid place-items-center shrink-0 ring-1 ${bg}`}>
                        <Icon className={`h-4 w-4 ${ic}`} />
                      </div>
                      <span className="text-[14px] text-slate-600 leading-snug">{text}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/${locale}/dashboard/referrals`}
                  className="mt-8 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-white transition-all hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(135deg, #0d9488, #0284c7)", boxShadow: "0 8px 24px -8px rgba(13,148,136,0.45)" }}
                >
                  Получить реферальную ссылку
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── FINAL CTA ───── */}
      <section className="relative overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1600&q=85&auto=format&fit=crop"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          aria-hidden
        />
        {/* Dark overlay — heavier on left for text, fades right so photo breathes */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, rgba(10,18,35,0.88) 0%, rgba(10,18,35,0.72) 45%, rgba(10,18,35,0.45) 100%)",
          }}
        />
        {/* Subtle teal tint only at left edge */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, rgba(13,148,136,0.22) 0%, transparent 55%)",
          }}
        />
        {/* Soft edge to dark footer */}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-slate-900/50 to-transparent pointer-events-none" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 py-28 md:py-36">
          <div className="grid lg:grid-cols-[1fr_400px] gap-14 lg:gap-20 items-center">

            {/* ── Left: Content ── */}
            <div>
              {/* Social proof row */}
              <div className="flex items-center gap-4 mb-8">
                <div className="flex -space-x-2.5">
                  {[
                    { l: "А", g: "from-teal-400 to-teal-600" },
                    { l: "Д", g: "from-sky-400 to-sky-600" },
                    { l: "З", g: "from-amber-400 to-orange-500" },
                    { l: "М", g: "from-rose-400 to-rose-600" },
                  ].map(({ l, g }, i) => (
                    <div
                      key={l}
                      className={`h-10 w-10 rounded-full ring-[2.5px] ring-white/60 grid place-items-center text-white font-bold text-sm bg-linear-to-br ${g}`}
                      style={{ zIndex: 4 - i }}
                    >
                      {l}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="ml-1.5 text-white font-bold text-sm">4.9</span>
                  </div>
                  <p className="text-white/50 text-[13px] mt-0.5">12 000+ довольных путешественников</p>
                </div>
              </div>

              <h2
                className="font-black text-white leading-[0.88] tracking-[-0.03em]"
                style={{ fontSize: "clamp(44px, 6.5vw, 84px)" }}
              >
                Твоё следующее
                <br />
                <span
                  style={{
                    background: "linear-gradient(135deg, #fde68a 0%, #fb923c 50%, #f43f5e 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  приключение
                </span>
                <br />
                ждёт тебя.
              </h2>

              <p className="mt-6 text-white/65 text-lg leading-relaxed max-w-lg">
                Зарегистрируйся и начни зарабатывать реферальные баллы с первой же поездки. Бесплатные туры — реальнее, чем кажется.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href={`/${locale}/register`}
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-bold text-base bg-white text-teal-700 hover:-translate-y-0.5 transition-all shadow-[0_16px_40px_-8px_rgba(0,0,0,0.35)]"
                >
                  Зарегистрироваться бесплатно
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={`/${locale}/tours`}
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-bold text-base text-white bg-white/10 ring-1 ring-white/25 hover:bg-white/18 transition-all"
                >
                  Смотреть туры
                </Link>
              </div>

              {/* Trust badges */}
              <div className="mt-8 flex flex-wrap gap-x-7 gap-y-2.5">
                {([
                  { icon: Shield,      text: "Без скрытых комиссий" },
                  { icon: CheckCircle2,text: "Гарантия возврата" },
                  { icon: Headphones,  text: "24/7 поддержка" },
                ] as const).map(({ icon: Icon, text }) => (
                  <span key={text} className="inline-flex items-center gap-1.5 text-[13px] text-white/50">
                    <Icon className="h-4 w-4 text-teal-300 shrink-0" />
                    {text}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Right: Floating cards ── */}
            <div className="relative hidden lg:block h-[460px]">

              {/* Glass stats card — center */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] rounded-3xl p-6"
                style={{
                  background: "rgba(255,255,255,0.09)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.16)",
                  boxShadow: "0 32px 64px -16px rgba(0,0,0,0.35)",
                }}
              >
                <p className="text-white/45 text-[11px] uppercase tracking-wider font-semibold">Сэкономлено клиентами</p>
                <p className="text-white font-black text-4xl mt-1 tabular-nums">$284 000</p>
                <div className="mt-4 h-1.5 rounded-full bg-white/10">
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: "75%", background: "linear-gradient(90deg, #2dd4bf, #38bdf8)" }}
                  />
                </div>
                <p className="text-white/30 text-[11px] mt-1.5">75% к цели — $400 000</p>
                <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-white font-bold text-xl tabular-nums">12K+</p>
                    <p className="text-white/35 text-[11px] mt-0.5">клиентов</p>
                  </div>
                  <div>
                    <p className="text-white font-bold text-xl tabular-nums">50+</p>
                    <p className="text-white/35 text-[11px] mt-0.5">стран</p>
                  </div>
                </div>
              </div>

              {/* Top-right: success story */}
              <div className="absolute top-0 right-0 bg-white rounded-2xl p-4 w-[210px] shadow-[0_20px_48px_-12px_rgba(0,0,0,0.35)]">
                <div className="flex items-center gap-2.5">
                  <div
                    className="h-9 w-9 rounded-full grid place-items-center text-white font-bold text-sm shrink-0"
                    style={{ background: "linear-gradient(135deg, #0d9488, #0284c7)" }}
                  >
                    А
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-[13px] leading-none truncate">Алина Коваль</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">Бали · 10 ночей</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[11px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full ring-1 ring-green-100">
                    Бесплатно ✓
                  </span>
                </div>
              </div>

              {/* Bottom-left: live notification */}
              <div className="absolute bottom-6 left-0 bg-white rounded-2xl p-3.5 w-[200px] shadow-[0_16px_40px_-10px_rgba(0,0,0,0.28)] flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="h-9 w-9 rounded-xl bg-rose-50 grid place-items-center ring-1 ring-rose-100">
                    <Flame className="h-4 w-4 text-rose-500" />
                  </div>
                  <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-rose-500 border-2 border-white animate-pulse" />
                </div>
                <div className="min-w-0">
                  <p className="text-slate-900 text-[12px] font-bold leading-none">Новое бронирование</p>
                  <p className="text-slate-400 text-[11px] mt-0.5 truncate">Дмитрий → Мальдивы</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ───────── Helpers ───────── */

function Feature({
  icon: Icon, title, text, stat, tone,
}: {
  icon: React.ElementType;
  title: string;
  text: string;
  stat: string;
  tone: "teal" | "rose" | "amber" | "sky";
}) {
  const palette = {
    teal:  { grad: "from-teal-500 to-teal-600",    soft: "bg-teal-50  ring-teal-100",  chip: "bg-teal-50  text-teal-700  ring-teal-200",  glow: "rgba(13,148,136,0.35)"  },
    rose:  { grad: "from-rose-500 to-rose-600",    soft: "bg-rose-50  ring-rose-100",  chip: "bg-rose-50  text-rose-700  ring-rose-200",  glow: "rgba(244,63,94,0.32)"   },
    amber: { grad: "from-amber-400 to-orange-500", soft: "bg-amber-50 ring-amber-100", chip: "bg-amber-50 text-amber-700 ring-amber-200", glow: "rgba(245,158,11,0.32)"  },
    sky:   { grad: "from-sky-500 to-sky-600",      soft: "bg-sky-50   ring-sky-100",   chip: "bg-sky-50   text-sky-700   ring-sky-200",   glow: "rgba(14,165,233,0.32)"  },
  } as const;
  const p = palette[tone];

  return (
    <div className="group relative flex flex-col gap-4 rounded-2xl bg-white p-6 ring-1 ring-slate-100 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.10)] hover:shadow-[0_4px_8px_rgba(15,23,42,0.05),0_20px_40px_-12px_rgba(15,23,42,0.14)] hover:-translate-y-1 transition-all duration-300 overflow-hidden">

      {/* Subtle background glow on hover */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl ${p.soft}`} style={{ opacity: 0 }} aria-hidden />

      {/* Top accent line */}
      <div
        aria-hidden
        className={`absolute top-0 left-6 right-6 h-[2px] rounded-full bg-linear-to-r ${p.grad} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
      />

      {/* Icon */}
      <div
        className={`relative z-10 grid place-items-center h-14 w-14 rounded-2xl bg-linear-to-br ${p.grad} text-white shrink-0`}
        style={{ boxShadow: `0 12px 28px -8px ${p.glow}` }}
      >
        <Icon className="h-6 w-6" />
      </div>

      {/* Text */}
      <div className="relative z-10 flex-1">
        <p className="font-bold text-slate-900 text-[15px] leading-snug">{title}</p>
        <p className="text-[13px] text-slate-500 mt-2 leading-relaxed">{text}</p>
      </div>

      {/* Stat chip */}
      <div className={`relative z-10 self-start inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ring-1 text-[11px] font-bold ${p.chip}`}>
        <CheckCircle2 className="h-3 w-3 shrink-0" />
        {stat}
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

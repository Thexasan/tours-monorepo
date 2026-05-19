import { getLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import {
  Share2, ShoppingBag,
  MapPin, Star, Shield, Award,
  Sparkles, ArrowRight, CheckCircle2,
  Headphones, ChevronDown,
  MessageCircle, Send, Flame,
  Globe, Compass, Plane,
} from "lucide-react";
import Link from "next/link";
import { SearchForm } from "@/src/components/search/search-form";
import { type Tour } from "@tours/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

const TESTIMONIAL_TONES = ["teal", "rose", "amber", "sky"] as const;
const TONE_CLASSES: Record<string, { bg: string }> = {
  teal:  { bg: "from-teal-500 to-teal-700" },
  rose:  { bg: "from-rose-500 to-rose-700" },
  amber: { bg: "from-amber-500 to-amber-600" },
  sky:   { bg: "from-sky-500 to-sky-700" },
};

const DEST_KEYS = ["bali", "turkey", "dubai", "maldives", "thailand", "egypt"] as const;
const DEST_COUNTRY_EN = { bali: "Bali", turkey: "Turkey", dubai: "UAE", maldives: "Maldives", thailand: "Thailand", egypt: "Egypt" };
const DEST_TOURS = { bali: 12, turkey: 18, dubai: 9, maldives: 7, thailand: 14, egypt: 11 };
const DEST_IMAGES = {
  bali:     "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80&auto=format&fit=crop",
  turkey:   "https://images.unsplash.com/photo-1589561253898-768105ca91a8?w=800&q=80&auto=format&fit=crop",
  dubai:    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80&auto=format&fit=crop",
  maldives: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80&auto=format&fit=crop",
  thailand: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&q=80&auto=format&fit=crop",
  egypt:    "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&q=80&auto=format&fit=crop",
};

const POPULAR_DEST_KEYS = ["bali", "maldives", "dubai", "thailand"] as const;

export default async function HomePage() {
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("home"),
  ]);

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

  const STEPS = [
    { num: "01", Icon: Share2,     title: t("howItWorks.step1.title"), desc: t("howItWorks.step1.desc") },
    { num: "02", Icon: ShoppingBag, title: t("howItWorks.step2.title"), desc: t("howItWorks.step2.desc") },
    { num: "03", Icon: Plane,      title: t("howItWorks.step3.title"), desc: t("howItWorks.step3.desc") },
  ];

  const TRUST_CARDS = [
    { icon: Shield,     title: t("trust.security.title"), text: t("trust.security.text") },
    { icon: Headphones, title: t("trust.support.title"),  text: t("trust.support.text")  },
    { icon: Award,      title: t("trust.price.title"),    text: t("trust.price.text")    },
    { icon: Sparkles,   title: t("trust.free.title"),     text: t("trust.free.text")     },
  ];

  const TESTIMONIALS = [0, 1, 2, 3].map((i) => ({
    name:  t(`testimonials.item${i}name` as any),
    city:  t(`testimonials.item${i}city` as any),
    text:  t(`testimonials.item${i}text` as any),
    tour:  t(`testimonials.item${i}tour` as any),
    tone:  TESTIMONIAL_TONES[i]!,
    rating: 5,
  }));

  return (
    <div className="flex flex-col w-full bg-[#f8fafc] font-sans selection:bg-teal-500/30">

      {/* ───── HERO ───── */}
      <section className="relative -mt-16 min-h-[100dvh] md:h-[100vh] md:min-h-[700px] overflow-hidden">
        {[
          "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=2000&q=85&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=2000&q=85&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=2000&q=85&auto=format&fit=crop",
        ].map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 transition-opacity duration-1000 animate-[hero-crossfade_18s_infinite]"
            style={{ animationDelay: i === 0 ? "-1.44s" : `${i * 6}s`, opacity: i === 0 ? 1 : 0, zIndex: 0 }}
          >
            <Image src={src} alt="Hero destination" fill priority={i === 0} sizes="100vw"
              className="object-cover scale-105 animate-[slow-zoom_18s_infinite]"
              style={{ animationDelay: `${i * 6}s` }}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80 z-1" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.4)_100%)] z-1" />

        <div className="relative z-10 flex flex-col md:h-full md:justify-center pt-24 pb-10 md:pb-16">
          <div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">

            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6 shadow-2xl transition-transform hover:scale-105">
                <Globe className="w-4 h-4 text-teal-400" />
                <span className="text-white/90 text-sm font-medium tracking-wide">{t("hero.badge")}</span>
              </div>

              <h1 className="font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70 leading-[1.1] tracking-tight drop-shadow-2xl mb-4 md:mb-6 text-4xl sm:text-5xl lg:text-7xl xl:text-8xl" style={{ filter: "drop-shadow(0px 4px 20px rgba(0,0,0,0.5))" }}>
                {t("hero.headingLine1")} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-300">
                  {t("hero.headingAccent")}
                </span>
              </h1>

              <p className="text-base md:text-xl text-white/80 max-w-2xl mx-auto lg:mx-0 leading-relaxed mb-5 md:mb-8 font-light">
                {t("hero.description")}
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-6 md:mb-10">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-3">
                    {["https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop", "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"].map((img, i) => (
                      <img key={i} src={img} alt="User" className="w-10 h-10 rounded-full border-2 border-slate-900 object-cover" />
                    ))}
                  </div>
                  <div className="ml-2">
                    <p className="text-white font-bold text-sm">{t("hero.touristsCount")}</p>
                    <p className="text-white/60 text-xs">{t("hero.touristsLabel")}</p>
                  </div>
                </div>
                <div className="w-px h-8 bg-white/20 hidden sm:block mx-2" />
                <div className="flex items-center gap-1.5">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
                  <span className="text-white font-bold text-sm ml-1">{t("hero.rating")}</span>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-[480px] shrink-0 animate-[fade-in-up_1s_ease-out]">
              <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-1 rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.4)] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                <div className="bg-slate-900/40 backdrop-blur-xl p-6 rounded-[1.35rem] relative z-10 border border-white/10">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-white font-bold text-xl flex items-center gap-2">
                      <Compass className="w-5 h-5 text-teal-400" />
                      {t("hero.searchTitle")}
                    </h3>
                  </div>
                  <SearchForm />
                  <div className="mt-6 pt-5 border-t border-white/10">
                    <p className="text-white/50 text-xs uppercase tracking-wider mb-3 font-semibold">{t("hero.popularLabel")}</p>
                    <div className="flex flex-wrap gap-2">
                      {POPULAR_DEST_KEYS.map((key) => (
                        <Link
                          key={key}
                          href={`/${locale}/tours?country=${DEST_COUNTRY_EN[key]}&q=${encodeURIComponent(t(`destinations.${key}.name` as any))}`}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium text-white/80 bg-white/5 border border-white/10 hover:bg-white/20 hover:text-white transition-all shadow-sm"
                        >
                          {t(`destinations.${key}.name` as any)}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-10">
          <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors">
            <ChevronDown className="h-5 w-5 text-white" />
          </div>
        </div>
      </section>

      {/* ───── TRUST CARDS ───── */}
      <section className="relative z-20 -mt-8 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {TRUST_CARDS.map((feature, idx) => (
            <div key={idx} className="group relative bg-white/80 backdrop-blur-lg border border-slate-200/60 p-6 rounded-3xl shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-teal-500/20 transition-all duration-500 hover:-translate-y-2 overflow-hidden">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-50 rounded-full group-hover:scale-150 transition-transform duration-700 ease-out" />
              <div className="w-12 h-12 rounded-2xl mb-4 flex items-center justify-center relative z-10 text-white bg-gradient-to-br from-teal-400 to-teal-600 shadow-lg shadow-teal-500/25">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2 relative z-10">{feature.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed relative z-10">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───── DESTINATIONS ───── */}
      <section className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <SectionHeader
            eyebrow={t("destinations.eyebrow")}
            title={t("destinations.title")}
            description={t("destinations.description")}
            action={
              <Link href={`/${locale}/tours`} className="group flex items-center gap-2 px-6 py-3 bg-white text-teal-600 font-semibold rounded-full shadow-sm hover:shadow-md border border-slate-200 transition-all">
                {t("destinations.viewAll")} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            }
          />

          <div className="mt-12 grid grid-cols-1 md:grid-cols-4 grid-rows-[auto] gap-4 md:gap-6">
            {DEST_KEYS.map((key, idx) => {
              const isLarge  = idx === 0;
              const isMedium = idx === 1 || idx === 2;
              const classes  = isLarge
                ? "md:col-span-2 md:row-span-2 min-h-[400px] md:min-h-[500px]"
                : isMedium
                ? "md:col-span-2 min-h-[250px]"
                : "md:col-span-1 min-h-[250px]";
              const name    = t(`destinations.${key}.name` as any);
              const country = t(`destinations.${key}.country` as any);
              const tag     = t(`destinations.${key}.tag` as any);
              return (
                <Link
                  key={key}
                  href={`/${locale}/tours?country=${DEST_COUNTRY_EN[key]}&q=${encodeURIComponent(name)}`}
                  className={`group relative rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-teal-900/20 transition-all duration-700 ${classes}`}
                >
                  <Image src={DEST_IMAGES[key]} alt={name} fill className="object-cover transition-transform duration-[1.5s] group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
                  <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
                    <span className="px-3 py-1.5 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-full border border-white/30 shadow-lg">{tag}</span>
                  </div>
                  <div className="absolute bottom-0 left-0 p-6 sm:p-8 w-full transform group-hover:-translate-y-2 transition-transform duration-500">
                    <div className="flex items-center gap-2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                      <span className="w-8 h-px bg-teal-400" />
                      <span className="text-teal-400 text-xs font-bold uppercase tracking-wider">{country}</span>
                    </div>
                    <h3 className={`${isLarge ? "text-4xl md:text-5xl" : "text-2xl md:text-3xl"} font-black text-white tracking-tight mb-2`}>{name}</h3>
                    <div className="flex items-center justify-between text-white/80 text-sm font-medium">
                      <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {DEST_TOURS[key]} {t("destinations.toursCount")}</span>
                      <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0 border border-white/20">
                        <ArrowRight className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───── HOT TOURS ───── */}
      {hotTours.length > 0 && (
        <section className="bg-slate-900 py-24 md:py-32 relative overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-teal-500/8 rounded-full blur-[120px] pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight flex items-center gap-4">
                <Flame className="w-8 h-8 md:w-10 md:h-10 text-rose-500 animate-pulse" />
                {t("hotTours.title")}
              </h2>
              <Link href={`/${locale}/tours`} className="hidden md:flex items-center gap-2 text-white/70 hover:text-white transition-colors font-medium">
                {t("hotTours.viewAll")} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 lg:gap-6">
              {hotTours.slice(0, 4).map((tour, index) => {
                const tourTitle    = tour.title[locale as keyof typeof tour.title] ?? tour.title.ru;
                const tourLocation = [tour.city, tour.country].filter(Boolean).join(", ");
                let spanClasses = "";
                if (index === 0) spanClasses = "md:col-span-2 md:row-span-2 h-[450px] md:h-[620px]";
                else if (index === 1) spanClasses = "md:col-span-2 md:row-span-1 h-[300px] md:h-[300px]";
                else spanClasses = "md:col-span-1 md:row-span-1 h-[300px] md:h-[300px]";
                return (
                  <div key={tour.id} className={`group relative rounded-[2rem] overflow-hidden transition-all duration-700 hover:-translate-y-2 hover:shadow-[0_30px_60px_rgba(243,24,70,0.15)] cursor-pointer ${spanClasses}`}>
                    {tour.coverImage
                      ? <Image src={tour.coverImage} alt={tourTitle} fill className="object-cover transition-transform duration-1000 group-hover:scale-105" />
                      : <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
                    }
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/60 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
                    <div className="absolute top-5 left-5 bg-rose-500 text-white text-[10px] font-black tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-[0_0_20px_rgba(243,24,70,0.4)]">
                      <Flame className="w-3.5 h-3.5" /> HOT
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 flex flex-col justify-end">
                      <div className="transform translate-y-3 group-hover:translate-y-0 transition-transform duration-500">
                        <p className="text-teal-400 text-[10px] font-black tracking-[0.2em] uppercase mb-3 flex items-center gap-1.5 drop-shadow-md">
                          <MapPin className="w-3.5 h-3.5" /> {tourLocation}
                        </p>
                        <h3 className={`font-black text-white leading-[1.15] mb-6 drop-shadow-lg ${index === 0 ? "text-3xl md:text-5xl" : "text-2xl"}`}>{tourTitle}</h3>
                        <div className="flex items-end justify-between pt-5 border-t border-white/10">
                          <div>
                            <p className="text-[10px] text-white/50 uppercase tracking-[0.15em] font-bold mb-1">{t("hotTours.costLabel")}</p>
                            <p className="text-3xl font-black text-white flex items-baseline gap-1">
                              ${tour.priceUsd} <span className="text-sm font-medium text-white/50">{t("hotTours.perPerson")}</span>
                            </p>
                          </div>
                          <Link href={`/${locale}/tours/${tour.slug}`} className="w-12 h-12 rounded-full border border-white/20 text-white flex items-center justify-center group-hover:bg-white group-hover:text-slate-900 group-hover:border-transparent transition-all duration-300">
                            <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ───── HOW IT WORKS ───── */}
      <section className="py-24 md:py-32 bg-white relative border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-12 items-start">
            <div className="lg:col-span-5 lg:sticky lg:top-32 pt-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-[0.15em] mb-8 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-teal-500" /> {t("howItWorks.badge")}
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
                {t("howItWorks.heading")} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-400 to-slate-600">{t("howItWorks.headingAccent")}</span>
              </h2>
              <p className="text-slate-500 text-lg md:text-xl leading-relaxed mb-10 max-w-md font-medium">{t("howItWorks.description")}</p>
              <Link href={`/${locale}/register`} className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900 text-white font-bold text-lg rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 hover:-translate-y-1">
                {t("howItWorks.cta")} <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="lg:col-span-7 flex flex-col gap-6 md:gap-8">
              {STEPS.map((item, idx) => (
                <div key={idx} className="relative bg-white rounded-[2.5rem] p-8 md:p-12 border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden group hover:-translate-y-2 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] transition-all duration-500">
                  <div className="absolute -top-8 -right-4 text-[160px] md:text-[200px] font-black text-slate-50 leading-none select-none transition-transform duration-700 group-hover:scale-110 origin-top-right pointer-events-none">
                    {item.num}
                  </div>
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6 md:gap-10">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden group-hover:bg-white transition-colors duration-500">
                      <div className="absolute top-0 left-0 w-full h-1 bg-teal-500 transform origin-left scale-x-50 group-hover:scale-x-100 transition-transform duration-500" />
                      <item.Icon className="w-8 h-8 md:w-10 md:h-10 text-slate-700 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse shadow-sm" />
                        <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{item.title}</h3>
                      </div>
                      <p className="text-slate-500 leading-relaxed text-lg max-w-sm font-medium">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───── TESTIMONIALS ───── */}
      <section className="py-24 md:py-32 bg-slate-50 relative overflow-hidden border-b border-slate-100">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-12 items-start">
            <div className="lg:col-span-5 lg:sticky lg:top-32 pt-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-[0.15em] mb-8 shadow-sm">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {t("testimonials.eyebrow")}
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
                {t("testimonials.title")} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-teal-400">{t("testimonials.titleAccent")}</span>
              </h2>
              <p className="text-slate-500 text-lg md:text-xl leading-relaxed mb-10 max-w-md font-medium">{t("testimonials.subtitle")}</p>
              <Link href={`/${locale}/tours`} className="inline-flex items-center gap-3 px-8 py-4 bg-white border border-slate-200 text-slate-900 font-bold text-lg rounded-2xl hover:bg-slate-50 transition-all shadow-sm hover:shadow-md hover:-translate-y-1">
                {t("testimonials.cta")} <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="lg:col-span-7">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {[0, 1].map((col) => (
                  <div key={col} className={`flex flex-col gap-6 md:gap-8 ${col === 1 ? "md:mt-24" : ""}`}>
                    {TESTIMONIALS.filter((_, i) => i % 2 === col).map((tm, idx) => {
                      const tone = TONE_CLASSES[tm.tone] ?? TONE_CLASSES.teal!;
                      return (
                        <div key={idx} className="relative bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden group hover:-translate-y-2 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] transition-all duration-500">
                          <div className="absolute -top-10 -right-6 text-[180px] font-serif font-black text-slate-50 leading-none select-none pointer-events-none group-hover:-rotate-12 transition-transform duration-700 origin-center">"</div>
                          <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-center gap-1.5 mb-6">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`w-4 h-4 ${i < tm.rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`} />
                              ))}
                            </div>
                            <p className="text-slate-700 text-lg font-medium leading-relaxed mb-10">"{tm.text}"</p>
                            <div className="flex items-center gap-4 mt-auto pt-6 border-t border-slate-100">
                              <div className="relative">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl bg-gradient-to-br ${tone.bg} shadow-md transform group-hover:scale-110 transition-transform duration-500`}>
                                  {tm.name.charAt(0)}
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                </div>
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 text-base">{tm.name}</p>
                                <p className="text-slate-500 font-medium text-[13px] mt-0.5 flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> {tm.tour}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── FINAL CTA ───── */}
      <section className="py-24 max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">

          {/* Chat CTA */}
          <div className="bg-white rounded-[2.5rem] p-8 md:p-12 relative shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden group">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-teal-50/80 to-transparent rounded-full blur-3xl -z-10 group-hover:scale-110 transition-transform duration-1000" />
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 text-slate-600 text-xs font-bold mb-8 border border-slate-200 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              {t("chat.badge")}
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 leading-[1.1] tracking-tight">{t("chat.title")}</h2>
            <p className="text-slate-500 text-lg mb-10 max-w-sm leading-relaxed">{t("chat.subtitle")}</p>
            <div className="space-y-4 mb-10 relative z-10 w-full max-w-sm">
              <div className="flex justify-end transform hover:-translate-y-1 transition-transform">
                <div className="bg-slate-900 text-white px-5 py-3.5 rounded-2xl rounded-tr-sm text-sm font-medium shadow-md">
                  {t("chat.msg1")}
                </div>
              </div>
              <div className="flex items-end gap-3 transform hover:-translate-y-1 transition-transform">
                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0 border border-teal-200">
                  <Headphones className="w-4 h-4 text-teal-600" />
                </div>
                <div className="bg-white border border-slate-100 text-slate-800 px-5 py-3.5 rounded-2xl rounded-bl-sm text-sm font-medium shadow-lg shadow-slate-100">
                  {t("chat.msg2")}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 relative z-10">
              <a href="https://wa.me/992000000000" className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-green-500 hover:bg-green-400 text-white font-bold transition-all shadow-lg shadow-green-500/30 hover:-translate-y-1">
                <MessageCircle className="w-5 h-5" /> {t("chat.whatsapp")}
              </a>
              <a href="https://t.me/traveling_tours" className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#0088cc] hover:bg-[#0077b3] text-white font-bold transition-all shadow-lg shadow-[#0088cc]/30 hover:-translate-y-1">
                <Send className="w-5 h-5" /> {t("chat.telegram")}
              </a>
            </div>
          </div>

          {/* Loyalty CTA */}
          <div className="rounded-[2.5rem] relative shadow-xl overflow-hidden group min-h-[500px]">
            <Image src="https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=1200&q=80" alt="Travel free" fill className="object-cover group-hover:scale-105 transition-transform duration-1000" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/90" />
            <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-end">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold mb-6 w-max border border-white/30 shadow-lg">
                <Sparkles className="w-3.5 h-3.5 text-teal-300" /> {t("loyalty.badge")}
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white mb-4 leading-[1.1] tracking-tight drop-shadow-lg">
                {t("loyalty.title")} <br /><span className="text-teal-300">{t("loyalty.titleAccent")}</span>
              </h2>
              <p className="text-white/90 text-lg mb-8 max-w-md leading-relaxed font-medium drop-shadow">{t("loyalty.subtitle")}</p>
              <Link href={`/${locale}/register`} className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white text-slate-900 font-bold text-lg hover:bg-slate-50 transition-all hover:-translate-y-1 w-max shadow-xl shadow-black/20">
                {t("loyalty.cta")} <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}

function SectionHeader({ eyebrow, title, description, action, center }: {
  eyebrow: string; title: string; description?: string; action?: React.ReactNode; center?: boolean;
}) {
  return (
    <div className={`flex flex-col md:flex-row gap-6 mb-12 ${center ? "items-center text-center justify-center md:flex-col" : "items-end justify-between"}`}>
      <div className="max-w-2xl">
        <p className="text-sm font-bold uppercase tracking-[0.2em] mb-3 text-teal-600">{eyebrow}</p>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">{title}</h2>
        {description && <p className="mt-4 text-lg text-slate-500 leading-relaxed">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

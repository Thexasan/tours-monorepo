import Link from "next/link";
import { Compass, Camera, Send, Mail, MapPin } from "lucide-react";
import { NewsletterForm } from "@/src/components/shared/newsletter-form";

export function Footer() {
  return (
    <footer className="bg-slate-900">

      {/* ── Newsletter strip ── */}
      <div className="border-b border-white/[0.07]">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div>
            <p className="font-semibold text-white text-[15px]">Горящие туры — первыми</p>
            <p className="text-white/35 text-sm mt-0.5">Раз в неделю. Только лучшее, без спама.</p>
          </div>
          <NewsletterForm />
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-8 md:gap-10">

          {/* Brand — 5 cols */}
          <div className="col-span-2 md:col-span-5">
            <Link href="/ru" className="inline-flex items-center gap-2.5 font-bold">
              <span className="grid place-items-center h-10 w-10 rounded-xl text-white shrink-0"
                style={{ background: "linear-gradient(135deg, #0d9488, #0284c7)", boxShadow: "0 6px 16px -6px rgba(13,148,136,0.6)" }}>
                <Compass className="h-5 w-5" />
              </span>
              <span className="text-lg text-white">
                Traveling<span className="text-teal-400"> Tours</span>
              </span>
            </Link>

            <p className="mt-4 text-white/38 text-sm leading-relaxed max-w-[300px]">
              Бронируй лучшие туры, путешествуй с друзьями и получай бесплатные поездки по реферальной программе.
            </p>

            {/* Mini stats */}
            <div className="mt-6 grid grid-cols-3 gap-4 pb-6 border-b border-white/[0.07]">
              {[
                { value: "12K+", label: "Клиентов" },
                { value: "50+",  label: "Стран"    },
                { value: "4.9★", label: "Рейтинг"  },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p className="text-white font-bold text-xl leading-none tabular-nums">{value}</p>
                  <p className="text-white/30 text-xs mt-1.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Socials */}
            <div className="mt-5 flex gap-2">
              <a
                href="#"
                aria-label="Instagram"
                className="grid place-items-center h-9 w-9 rounded-xl bg-white/[0.07] text-white/40 hover:bg-white/14 hover:text-white transition-all"
              >
                <Camera className="h-4 w-4" />
              </a>
              <a
                href="https://t.me/traveling_tours"
                aria-label="Telegram"
                className="grid place-items-center h-9 w-9 rounded-xl bg-white/[0.07] text-white/40 hover:bg-white/14 hover:text-white transition-all"
              >
                <Send className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Туры — 3 cols */}
          <div className="md:col-span-3">
            <p className="text-white/22 text-[11px] font-bold uppercase tracking-[0.14em] mb-5">Туры</p>
            <ul className="space-y-3">
              {[
                { label: "Каталог",       href: "/ru/tours" },
                { label: "Бали",          href: "/ru/tours?country=Bali&q=%D0%91%D0%B0%D0%BB%D0%B8" },
                { label: "Турция",        href: "/ru/tours?country=Turkey&q=%D0%A2%D1%83%D1%80%D1%86%D0%B8%D1%8F" },
                { label: "Мальдивы",      href: "/ru/tours?country=Maldives&q=%D0%9C%D0%B0%D0%BB%D1%8C%D0%B4%D0%B8%D0%B2%D1%8B" },
                { label: "Горящие туры",  href: "/ru/tours?sort=popular" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-white/45 hover:text-white text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Компания + контакты — 4 cols */}
          <div className="md:col-span-4">
            <p className="text-white/22 text-[11px] font-bold uppercase tracking-[0.14em] mb-5">Компания</p>
            <ul className="space-y-3">
              <li>
                <Link href="/ru/dashboard/referrals" className="text-white/45 hover:text-white text-sm transition-colors">
                  Реферальная программа
                </Link>
              </li>
              <li>
                <a href="mailto:support@traveling-tours.local" className="text-white/45 hover:text-white text-sm transition-colors">
                  Поддержка
                </a>
              </li>
            </ul>

            <p className="text-white/22 text-[11px] font-bold uppercase tracking-[0.14em] mt-8 mb-4">Контакты</p>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:support@traveling-tours.local"
                  className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors group"
                >
                  <Mail className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                  support@traveling-tours.local
                </a>
              </li>
              <li className="inline-flex items-center gap-2 text-white/35 text-sm">
                <MapPin className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                Ташкент · Алматы · Бишкек
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-white/6 py-5">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-white/22 text-xs">
            © {new Date().getFullYear()} Traveling Tours · Все права защищены
          </p>
          <div className="flex items-center gap-5 text-white/22 text-xs">
            <a href="#" className="hover:text-white/50 transition-colors">Конфиденциальность</a>
            <a href="#" className="hover:text-white/50 transition-colors">Условия использования</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

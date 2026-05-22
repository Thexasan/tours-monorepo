import Link from "next/link";
import { Compass, Camera, Send } from "lucide-react";
import { getTranslations, getLocale } from "next-intl/server";
import { NewsletterForm } from "@/src/components/shared/newsletter-form";

export async function Footer() {
  const t = await getTranslations();
  const locale = await getLocale();

  return (
    <footer className="bg-slate-900">

      {/* ── Newsletter strip ── */}
      <div className="border-b border-white/[0.07]">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-5">
          <div>
            <p className="font-semibold text-white text-[15px]">{t("footer.newsletter.title")}</p>
            <p className="text-white/35 text-sm mt-0.5">{t("footer.newsletter.subtitle")}</p>
          </div>
          <NewsletterForm />
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-8 md:gap-10">

          {/* Brand — 5 cols */}
          <div className="col-span-2 md:col-span-5">
            <Link href={`/${locale}`} className="inline-flex items-center gap-2.5 font-bold">
              <span className="grid place-items-center h-10 w-10 rounded-xl text-white shrink-0"
                style={{ background: "linear-gradient(135deg, #027455, #03956a)", boxShadow: "0 6px 16px -6px rgba(2,116,85,0.6)" }}>
                <Compass className="h-5 w-5" />
              </span>
              <span className="text-lg text-white">
                Traveling<span className="text-[#4aad8a]"> Tours</span>
              </span>
            </Link>

            <p className="mt-4 text-white/38 text-sm leading-relaxed max-w-[300px]">
              {t("footer.brandDesc")}
            </p>

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
            <p className="text-white/22 text-[11px] font-bold uppercase tracking-[0.14em] mb-5">
              {t("footer.tours.title")}
            </p>
            <ul className="space-y-3">
              <li>
                <Link href={`/${locale}/tours`} className="text-white/45 hover:text-white text-sm transition-colors">
                  {t("footer.tours.catalog")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/tours?country=Bali&q=%D0%91%D0%B0%D0%BB%D0%B8`} className="text-white/45 hover:text-white text-sm transition-colors">
                  {t("footer.tours.bali")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/tours?country=Turkey&q=%D0%A2%D1%83%D1%80%D1%86%D0%B8%D1%8F`} className="text-white/45 hover:text-white text-sm transition-colors">
                  {t("footer.tours.turkey")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/tours?country=Maldives&q=%D0%9C%D0%B0%D0%BB%D1%8C%D0%B4%D0%B8%D0%B2%D1%8B`} className="text-white/45 hover:text-white text-sm transition-colors">
                  {t("footer.tours.maldives")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/tours?sort=popular`} className="text-white/45 hover:text-white text-sm transition-colors">
                  {t("footer.tours.hotTours")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Компания + контакты — 4 cols */}
          <div className="md:col-span-4">
            <p className="text-white/22 text-[11px] font-bold uppercase tracking-[0.14em] mb-5">
              {t("footer.company.title")}
            </p>
            <ul className="space-y-3">
              <li>
                <Link href={`/${locale}/dashboard/referrals`} className="text-white/45 hover:text-white text-sm transition-colors">
                  {t("footer.company.referral")}
                </Link>
              </li>
              <li>
                <a href="mailto:support@traveling-tours.local" className="text-white/45 hover:text-white text-sm transition-colors">
                  {t("footer.company.support")}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-white/6 py-5">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-white/22 text-xs">
            © {new Date().getFullYear()} Traveling Tours · {t("footer.copyright")}
          </p>
          <div className="flex items-center gap-5 text-white/22 text-xs">
            <a href="#" className="hover:text-white/50 transition-colors">{t("footer.privacy")}</a>
            <a href="#" className="hover:text-white/50 transition-colors">{t("footer.terms")}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

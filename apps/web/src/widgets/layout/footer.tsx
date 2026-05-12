import Link from "next/link";
import { Compass, Camera, Send, Mail, MapPin } from "lucide-react";
import { PageWrapper } from "@/src/widgets/layout/page-wrapper";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-gradient-to-b from-white to-slate-50">
      <PageWrapper size="wide" className="py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2">
            <Link href="/ru" className="inline-flex items-center gap-2 font-bold">
              <span className="grid place-items-center h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-sky-600 text-white shadow-[0_6px_16px_-6px_rgba(13,148,136,0.55)]">
                <Compass className="h-5 w-5" />
              </span>
              <span className="text-lg text-slate-900">
                Traveling<span className="text-teal-600"> Tours</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-slate-500 max-w-sm leading-relaxed">
              Бронируй лучшие туры, путешествуй с друзьями и получай бесплатные поездки.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <a href="#" aria-label="Instagram" className="grid place-items-center h-9 w-9 rounded-xl border border-slate-200 text-slate-500 hover:text-teal-700 hover:border-teal-200 hover:bg-teal-50 transition-colors">
                <Camera className="h-4 w-4" />
              </a>
              <a href="#" aria-label="Telegram" className="grid place-items-center h-9 w-9 rounded-xl border border-slate-200 text-slate-500 hover:text-teal-700 hover:border-teal-200 hover:bg-teal-50 transition-colors">
                <Send className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 mb-3">Туры</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/ru/tours" className="text-slate-600 hover:text-teal-700">Каталог</Link></li>
              <li><Link href="/ru/tours?search=Бали" className="text-slate-600 hover:text-teal-700">Бали</Link></li>
              <li><Link href="/ru/tours?search=Турция" className="text-slate-600 hover:text-teal-700">Турция</Link></li>
              <li><Link href="/ru/tours?search=Мальдивы" className="text-slate-600 hover:text-teal-700">Мальдивы</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 mb-3">Компания</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/ru/dashboard/referrals" className="text-slate-600 hover:text-teal-700">Реферальная программа</Link></li>
              <li><a href="mailto:support@traveling-tours.local" className="text-slate-600 hover:text-teal-700">Поддержка</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Traveling Tours · Все права защищены</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-teal-600" />
              support@traveling-tours.local
            </span>
            <span className="hidden md:inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-rose-500" />
              Ташкент · Алматы · Бишкек
            </span>
          </div>
        </div>
      </PageWrapper>
    </footer>
  );
}

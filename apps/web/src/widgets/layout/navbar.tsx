import Link from "next/link";
import { Compass } from "lucide-react";
import { PageWrapper } from "@/src/widgets/layout/page-wrapper";
import { CurrencySelector } from "@/src/components/shared/currency-selector";
import { UserMenu } from "@/src/widgets/layout/user-menu";
import { LanguageSwitcher } from "@/src/widgets/layout/language-switcher";

const T = {
  home: "Главная",
  tours: "Туры",
  partner: "Партнёрам",
};

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/65">
      <PageWrapper size="wide" className="flex h-16 items-center justify-between">
        <Link href="/ru" className="group inline-flex items-center gap-2 font-bold tracking-tight">
          <span className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-to-br from-teal-500 to-sky-600 text-white shadow-[0_6px_16px_-6px_rgba(13,148,136,0.55)] transition-transform group-hover:rotate-[-6deg]">
            <Compass className="h-5 w-5" />
          </span>
          <span className="text-[17px] text-slate-900">
            Traveling<span className="text-teal-600"> Tours</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link href="/ru" className="hidden sm:inline-block px-3 py-2 text-sm font-medium text-slate-700 hover:text-teal-700 rounded-lg hover:bg-slate-50 transition-colors">
            {T.home}
          </Link>
          <Link href="/ru/tours" className="hidden sm:inline-block px-3 py-2 text-sm font-medium text-slate-700 hover:text-teal-700 rounded-lg hover:bg-slate-50 transition-colors">
            {T.tours}
          </Link>
          <Link href="/ru/become-partner" className="hidden md:inline-block px-3 py-2 text-sm font-medium text-slate-700 hover:text-teal-700 rounded-lg hover:bg-slate-50 transition-colors">
            {T.partner}
          </Link>

          <div className="mx-1 hidden md:flex items-center gap-1 border-l border-slate-200 pl-2">
            <LanguageSwitcher />
            <CurrencySelector />
          </div>

          <UserMenu />
        </nav>
      </PageWrapper>
    </header>
  );
}

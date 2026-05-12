"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Compass } from "lucide-react";
import { PageWrapper } from "@/src/widgets/layout/page-wrapper";
import { CurrencySelector } from "@/src/components/shared/currency-selector";
import { UserMenu } from "@/src/widgets/layout/user-menu";
import { LanguageSwitcher } from "@/src/widgets/layout/language-switcher";
import { cn } from "@/src/lib/utils";

const T = {
  home: "Главная",
  tours: "Туры",
};

export function Navbar() {
  const pathname = usePathname();
  const isHome = /^\/[a-z]{2}\/?$/.test(pathname ?? "");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isHome) {
      setScrolled(true);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  const transparent = isHome && !scrolled;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all duration-300",
        transparent
          ? "bg-transparent border-transparent"
          : "border-b border-slate-200/70 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/65"
      )}
    >
      <PageWrapper size="wide" className="flex h-16 items-center justify-between">
        <Link href="/ru" className="group inline-flex items-center gap-2 font-bold tracking-tight">
          <span className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-to-br from-teal-500 to-sky-600 text-white shadow-[0_6px_16px_-6px_rgba(13,148,136,0.55)] transition-transform group-hover:rotate-[-6deg]">
            <Compass className="h-5 w-5" />
          </span>
          <span className={cn("text-[17px] transition-colors duration-300", transparent ? "text-white" : "text-slate-900")}>
            Traveling
            <span className={cn("transition-colors duration-300", transparent ? "text-teal-300" : "text-teal-600")}>
              {" "}Tours
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/ru"
            className={cn(
              "hidden sm:inline-block px-3 py-2 text-sm font-medium rounded-lg transition-colors",
              transparent
                ? "text-white/85 hover:text-white hover:bg-white/10"
                : "text-slate-700 hover:text-teal-700 hover:bg-slate-50"
            )}
          >
            {T.home}
          </Link>
          <Link
            href="/ru/tours"
            className={cn(
              "hidden sm:inline-block px-3 py-2 text-sm font-medium rounded-lg transition-colors",
              transparent
                ? "text-white/85 hover:text-white hover:bg-white/10"
                : "text-slate-700 hover:text-teal-700 hover:bg-slate-50"
            )}
          >
            {T.tours}
          </Link>

          <div
            className={cn(
              "mx-1 hidden md:flex items-center gap-1 pl-2 transition-colors duration-300",
              transparent ? "border-l border-white/20" : "border-l border-slate-200"
            )}
          >
            <LanguageSwitcher />
            <CurrencySelector />
          </div>

          <UserMenu transparent={transparent} />
        </nav>
      </PageWrapper>
    </header>
  );
}

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

  // Pages where navbar overlaps a full-bleed hero image
  const isHomePage = /^\/[a-z]{2}\/?$/.test(pathname ?? "");
  const isTourDetail = /^\/[a-z]{2}\/tours\/[^/]+\/?$/.test(pathname ?? "");
  const isHeroPage = isHomePage || isTourDetail;

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isHeroPage) {
      setScrolled(true);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 72);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHeroPage]);

  const transparent = isHeroPage && !scrolled;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all duration-500",
        transparent
          ? "bg-transparent border-transparent shadow-none"
          : [
              "border-b border-slate-200/60",
              "bg-white/85 backdrop-blur-xl",
              "supports-[backdrop-filter]:bg-white/70",
              "shadow-[0_1px_12px_rgba(15,23,42,0.06)]",
            ].join(" "),
      )}
    >
      <PageWrapper size="wide" className="flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/ru" className="group inline-flex items-center gap-2.5 font-bold tracking-tight shrink-0">
          <span
            className={cn(
              "grid place-items-center h-9 w-9 rounded-xl text-white transition-transform duration-300 group-hover:rotate-[-6deg]",
              "bg-gradient-to-br from-teal-500 to-sky-600 shadow-[0_6px_16px_-6px_rgba(13,148,136,0.55)]",
            )}
          >
            <Compass className="h-5 w-5" />
          </span>
          <span
            className={cn(
              "text-[17px] transition-colors duration-300",
              transparent ? "text-white" : "text-slate-900",
            )}
          >
            Traveling
            <span className={cn("transition-colors duration-300", transparent ? "text-teal-300" : "text-teal-600")}>
              {" "}Tours
            </span>
          </span>
        </Link>

        {/* Nav links + controls */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <NavLink href="/ru" label={T.home} transparent={transparent} active={isHomePage} />
          <NavLink href="/ru/tours" label={T.tours} transparent={transparent} active={pathname?.includes("/tours")} />

          <div
            className={cn(
              "mx-1 hidden md:flex items-center gap-1 pl-2 transition-colors duration-300",
              transparent ? "border-l border-white/25" : "border-l border-slate-200",
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

function NavLink({
  href, label, transparent, active,
}: { href: string; label: string; transparent: boolean; active?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "hidden sm:inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 relative",
        transparent
          ? active
            ? "text-white bg-white/15"
            : "text-white/80 hover:text-white hover:bg-white/10"
          : active
          ? "text-teal-700 bg-teal-50"
          : "text-slate-700 hover:text-teal-700 hover:bg-slate-50",
      )}
    >
      {label}
      {active && !transparent && (
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-teal-500" />
      )}
    </Link>
  );
}

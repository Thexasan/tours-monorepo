import Link from "next/link";
import { PageWrapper } from "@/src/widgets/layout/page-wrapper";
import { CurrencySelector } from "@/src/components/shared/currency-selector";
import { UserMenu } from "@/src/widgets/layout/user-menu";
import { LanguageSwitcher } from "@/src/widgets/layout/language-switcher";

export function Navbar() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <PageWrapper className="flex h-16 items-center justify-between">
        <Link href="/ru" className="text-lg font-semibold text-zinc-900">
          Traveling Tours
        </Link>

        <nav className="flex items-center gap-4">
          <Link href="/ru" className="text-sm text-zinc-700 hover:text-zinc-900 hidden sm:inline">
            Главная
          </Link>
          <Link href="/ru/tours" className="text-sm text-zinc-700 hover:text-zinc-900 hidden sm:inline">
            Туры
          </Link>

          <div className="ml-2 hidden md:flex items-center gap-2 border-l border-zinc-200 pl-4">
            <LanguageSwitcher />
            <CurrencySelector />
          </div>

          <UserMenu />
        </nav>
      </PageWrapper>
    </header>
  );
}

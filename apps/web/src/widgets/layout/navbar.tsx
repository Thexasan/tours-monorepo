import Link from "next/link";
import { PageWrapper } from "@/src/widgets/layout/page-wrapper";
import { CurrencySelector } from "@/src/components/shared/currency-selector";

const navLinks = [
  { href: "/ru", label: "Главная" },
  { href: "/ru/tours", label: "Туры" },
  { href: "/ru/login", label: "Войти" },
];

export function Navbar() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <PageWrapper className="flex h-16 items-center justify-between">
        <Link href="/ru" className="text-lg font-semibold text-zinc-900">
          Traveling Tours
        </Link>

        <nav className="flex items-center gap-4">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-zinc-700 hover:text-zinc-900">
              {link.label}
            </Link>
          ))}
          <div className="ml-4 flex items-center border-l border-zinc-200 pl-4">
            <CurrencySelector />
          </div>
        </nav>
      </PageWrapper>
    </header>
  );
}

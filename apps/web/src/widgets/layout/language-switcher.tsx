"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Globe } from "lucide-react";

const LOCALES = [
  { code: "ru", label: "RU" },
  { code: "en", label: "EN" },
] as const;

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const currentLocale = useLocale();

  const switchTo = (newLocale: string) => {
    if (newLocale === currentLocale) return;
    // Заменить первый сегмент пути на новый locale
    const segments = pathname.split("/");
    if (segments.length > 1 && LOCALES.some((l) => l.code === segments[1])) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }
    const newPath = segments.join("/") || "/";
    router.push(newPath);
    router.refresh();
  };

  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-zinc-200 bg-white text-xs">
      <Globe className="w-3.5 h-3.5 text-zinc-500" />
      {LOCALES.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => switchTo(l.code)}
          className={`px-1.5 py-0.5 rounded transition-colors ${
            currentLocale === l.code
              ? "bg-zinc-900 text-white"
              : "text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

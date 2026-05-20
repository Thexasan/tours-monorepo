"use client";

import { useLocale } from "next-intl";
import { Globe } from "lucide-react";
import { usePathname, useRouter } from "@/src/i18n/routing";
import { cn } from "@/src/lib/utils";

const LOCALES = [
  { code: "ru", label: "RU" },
  { code: "en", label: "EN" },
  { code: "tr", label: "TR" },
] as const;

interface Props {
  transparent?: boolean;
  compact?: boolean;
}

export function LanguageSwitcher({ transparent = false, compact = false }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  return (
    <div className={cn("flex items-center gap-px", compact ? "px-1" : "px-2")}>
      {!compact && (
        <Globe className={cn("w-3.5 h-3.5 mr-1 shrink-0", transparent ? "text-white/50" : "text-slate-400")} />
      )}
      {LOCALES.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => router.replace(pathname, { locale: l.code })}
          className={cn(
            "px-1.5 py-0.5 rounded text-[11px] font-bold transition-all",
            currentLocale === l.code
              ? transparent
                ? "bg-white/20 text-white"
                : "bg-orange-500 text-white shadow-sm"
              : transparent
              ? "text-white/65 hover:text-white hover:bg-white/15"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/70",
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

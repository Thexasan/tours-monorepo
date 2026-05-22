"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import { Globe, Check } from "lucide-react";
import { usePathname, useRouter } from "@/src/i18n/routing";
import { cn } from "@/src/lib/utils";

const LOCALES = [
  { code: "ru", label: "RU", name: "Русский" },
  { code: "en", label: "EN", name: "English" },
  { code: "tr", label: "TR", name: "Türkçe" },
] as const;

interface Props {
  transparent?: boolean;
  compact?: boolean;
}

export function LanguageSwitcher({ transparent = false, compact = false }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const switchLocale = (code: string) => {
    router.replace(pathname, { locale: code });
    setOpen(false);
  };

  // ── Mobile: Globe icon + dropdown ──
  if (compact) {
    return (
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all",
            transparent
              ? "text-white/80 hover:text-white hover:bg-white/10"
              : open
              ? "text-teal-700 bg-teal-50"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
          )}
          aria-label="Выбрать язык"
        >
          <Globe className="w-4 h-4 shrink-0" />
          <span>{LOCALES.find((l) => l.code === currentLocale)?.label ?? "RU"}</span>
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 overflow-hidden">
            {LOCALES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => switchLocale(l.code)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors",
                  currentLocale === l.code
                    ? "bg-teal-50 text-teal-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                <span
                  className={cn(
                    "text-[10px] font-black w-7 text-center py-0.5 rounded shrink-0",
                    currentLocale === l.code
                      ? "bg-teal-600 text-white"
                      : "bg-slate-100 text-slate-500",
                  )}
                >
                  {l.label}
                </span>
                <span className="text-sm font-medium">{l.name}</span>
                {currentLocale === l.code && (
                  <Check className="w-3.5 h-3.5 text-teal-600 ml-auto shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Desktop: pills ──
  return (
    <div className="flex items-center gap-px px-2">
      <Globe className={cn("w-3.5 h-3.5 mr-1 shrink-0", transparent ? "text-white/50" : "text-slate-400")} />
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
                : "bg-teal-600 text-white shadow-sm"
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

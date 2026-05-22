"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Popover as PopoverPrimitive } from "radix-ui";
import { MapPin, Calendar, Users, Plus, Minus, ArrowRight, Compass, X } from "lucide-react";
import { DatePickerInput } from "@/src/components/ui/date-picker-input";

const DESTINATIONS = [
  { key: "bali",     country: "Bali",       color: "bg-emerald-500" },
  { key: "turkey",   country: "Turkey",     color: "bg-red-500" },
  { key: "dubai",    country: "UAE",        color: "bg-amber-500" },
  { key: "maldives", country: "Maldives",   color: "bg-sky-500" },
  { key: "thailand", country: "Thailand",   color: "bg-violet-500" },
  { key: "egypt",    country: "Egypt",      color: "bg-orange-500" },
  { key: "greece",   country: "Greece",     color: "bg-blue-500" },
  { key: "japan",    country: "Japan",      color: "bg-rose-500" },
  { key: "georgia",  country: "Georgia",    color: "bg-pink-500" },
  { key: "italy",    country: "Italy",      color: "bg-green-600" },
] as const;

const DEST_LABELS: Record<string, { label: string; sub: string }> = {
  bali:     { label: "Бали",    sub: "Индонезия" },
  turkey:   { label: "Турция",  sub: "Анталия · Стамбул" },
  dubai:    { label: "Дубай",   sub: "ОАЭ" },
  maldives: { label: "Мальдивы", sub: "Индийский океан" },
  thailand: { label: "Таиланд", sub: "Бангкок · Пхукет" },
  egypt:    { label: "Египет",  sub: "Хургада · Шарм-эль-Шейх" },
  greece:   { label: "Греция",  sub: "Санторини · Миконос" },
  japan:    { label: "Япония",  sub: "Токио · Киото" },
  georgia:  { label: "Грузия",  sub: "Тбилиси · Батуми" },
  italy:    { label: "Италия",  sub: "Рим · Милан · Венеция" },
};

const DEST_LABELS_EN: Record<string, { label: string; sub: string }> = {
  bali:     { label: "Bali",      sub: "Indonesia" },
  turkey:   { label: "Turkey",    sub: "Antalya · Istanbul" },
  dubai:    { label: "Dubai",     sub: "UAE" },
  maldives: { label: "Maldives",  sub: "Indian Ocean" },
  thailand: { label: "Thailand",  sub: "Bangkok · Phuket" },
  egypt:    { label: "Egypt",     sub: "Hurghada · Sharm" },
  greece:   { label: "Greece",    sub: "Santorini · Mykonos" },
  japan:    { label: "Japan",     sub: "Tokyo · Kyoto" },
  georgia:  { label: "Georgia",   sub: "Tbilisi · Batumi" },
  italy:    { label: "Italy",     sub: "Rome · Milan · Venice" },
};

const DEST_LABELS_TR: Record<string, { label: string; sub: string }> = {
  bali:     { label: "Bali",       sub: "Endonezya" },
  turkey:   { label: "Türkiye",    sub: "Antalya · İstanbul" },
  dubai:    { label: "Dubai",      sub: "BAE" },
  maldives: { label: "Maldivler",  sub: "Hint Okyanusu" },
  thailand: { label: "Tayland",    sub: "Bangkok · Phuket" },
  egypt:    { label: "Mısır",      sub: "Hurgada · Şarm" },
  greece:   { label: "Yunanistan", sub: "Santorini · Mikonos" },
  japan:    { label: "Japonya",    sub: "Tokyo · Kyoto" },
  georgia:  { label: "Gürcistan",  sub: "Tiflis · Batum" },
  italy:    { label: "İtalya",     sub: "Roma · Milano · Venedik" },
};

function getLabels(locale: string) {
  if (locale === "en") return DEST_LABELS_EN;
  if (locale === "tr") return DEST_LABELS_TR;
  return DEST_LABELS;
}

export function SearchForm() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("home.search");
  const inputRef = useRef<HTMLInputElement>(null);

  const labels = getLabels(locale);

  const [query, setQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState(1);
  const [destOpen, setDestOpen] = useState(false);
  const [activeSeg, setActiveSeg] = useState<"dest" | "date" | "guests" | null>(null);

  const suggestions = DESTINATIONS.filter((d) => {
    const { label, sub } = labels[d.key] ?? DEST_LABELS[d.key]!;
    return (
      !query ||
      label.toLowerCase().includes(query.toLowerCase()) ||
      sub.toLowerCase().includes(query.toLowerCase()) ||
      d.country.toLowerCase().includes(query.toLowerCase())
    );
  });

  useEffect(() => {
    if (!destOpen && activeSeg === "dest") setActiveSeg(null);
  }, [destOpen, activeSeg]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) {
      params.set("q", query);
      if (selectedCountry) {
        params.set("country", selectedCountry);
      } else {
        const match = DESTINATIONS.find((d) => {
          const { label } = labels[d.key] ?? DEST_LABELS[d.key]!;
          return label.toLowerCase() === query.toLowerCase();
        });
        params.set("country", match?.country ?? query);
      }
    }
    if (date) params.set("date", date);
    if (guests > 1) params.set("guests", String(guests));
    router.push(`/${locale}/tours?${params.toString()}`);
  };

  const pickDestination = (key: string, country: string) => {
    const { label } = labels[key] ?? DEST_LABELS[key]!;
    setQuery(label);
    setSelectedCountry(country);
    setDestOpen(false);
    setActiveSeg(null);
  };

  const clearQuery = () => {
    setQuery("");
    setSelectedCountry(null);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:gap-3">

        {/* ── Destination ── */}
        <PopoverPrimitive.Root
          open={destOpen}
          onOpenChange={(open) => {
            setDestOpen(open);
            if (open) setActiveSeg("dest");
          }}
        >
          <PopoverPrimitive.Anchor asChild>
            <div className={`relative flex flex-col justify-center px-3.5 py-2.5 sm:px-5 sm:py-4 bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-sm border transition-colors cursor-text hover:bg-white overflow-hidden ${activeSeg === "dest" ? "border-teal-500 shadow-teal-500/10" : "border-slate-100"}`}>
              <span className={`hidden sm:flex items-center gap-1.5 text-[11px] font-bold tracking-[0.15em] uppercase mb-1.5 transition-colors duration-150 ${activeSeg === "dest" ? "text-teal-600" : "text-slate-400"}`}>
                <MapPin className="h-3.5 w-3.5" />
                {t("destinationLabel")}
              </span>

              <div className="flex items-center gap-2">
                <MapPin className={`h-4 w-4 shrink-0 sm:hidden transition-colors ${activeSeg === "dest" ? "text-teal-500" : "text-slate-300"}`} />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedCountry(null);
                    setDestOpen(true);
                  }}
                  onFocus={() => {
                    setActiveSeg("dest");
                    setDestOpen(true);
                  }}
                  placeholder={t("destinationPlaceholder")}
                  className="flex-1 min-w-0 bg-transparent text-[16px] font-semibold text-slate-900 placeholder:text-slate-300 outline-none"
                  autoComplete="off"
                />
                {query && (
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); clearQuery(); }}
                    className="shrink-0 h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                    aria-label={t("clearAriaLabel")}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </PopoverPrimitive.Anchor>

          <PopoverPrimitive.Portal>
            <PopoverPrimitive.Content
              side="bottom"
              align="start"
              sideOffset={8}
              avoidCollisions={false}
              onInteractOutside={(e) => {
                if (inputRef.current?.contains(e.target as Node)) {
                  e.preventDefault();
                }
              }}
              onOpenAutoFocus={(e) => e.preventDefault()}
              className="z-50 w-[var(--radix-popover-trigger-width)] min-w-[280px] max-w-[400px] rounded-2xl bg-white shadow-[0_20px_56px_-12px_rgba(15,23,42,0.2),0_4px_16px_-4px_rgba(15,23,42,0.08)] border border-slate-100 overflow-hidden animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
            >
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                  {query ? t("searchResults") : t("popularDestinations")}
                </p>
              </div>

              {suggestions.length > 0 ? (
                <ul className="py-2 max-h-[300px] overflow-y-auto overscroll-contain">
                  {suggestions.map((d) => {
                    const { label, sub } = labels[d.key] ?? DEST_LABELS[d.key]!;
                    return (
                      <li key={d.key}>
                        <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); pickDestination(d.key, d.country); }}
                          className="w-full flex items-center gap-3.5 px-5 py-2.5 hover:bg-teal-50/60 transition-colors text-left group"
                        >
                          <div className={`shrink-0 grid place-items-center h-10 w-10 rounded-xl ${d.color} text-white text-sm font-bold shadow-sm select-none`}>
                            {label.slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-semibold text-slate-800 group-hover:text-teal-700 transition-colors">
                              {label}
                            </p>
                            <p className="text-[12px] text-slate-400 truncate leading-tight">{sub}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="px-5 py-8 text-center">
                  <Compass className="h-9 w-9 text-slate-200 mx-auto mb-2.5" />
                  <p className="text-[13px] font-semibold text-slate-500">{t("noResults")}</p>
                  <p className="text-[12px] text-slate-400 mt-0.5">{t("noResultsHint")}</p>
                </div>
              )}
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>

        <div className="flex gap-2 sm:gap-3">
          {/* ── Date ── */}
          <div className={`relative flex-1 min-w-0 flex flex-col justify-center px-3 py-2.5 sm:px-4 sm:py-4 bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-sm border transition-colors hover:bg-white overflow-hidden ${activeSeg === "date" ? "border-teal-500 shadow-teal-500/10" : "border-slate-100"}`}>
            <p className={`hidden sm:flex items-center gap-1.5 text-[10px] font-bold tracking-[0.15em] uppercase mb-1.5 transition-colors duration-150 pointer-events-none ${activeSeg === "date" ? "text-teal-600" : "text-slate-400"}`}>
              <Calendar className="h-3.5 w-3.5" />
              {t("dateLabel")}
            </p>
            <div className="flex items-center gap-1.5">
              <Calendar className={`h-4 w-4 shrink-0 sm:hidden transition-colors ${activeSeg === "date" ? "text-teal-500" : "text-slate-300"}`} />
              <div className="flex-1 min-w-0">
                <DatePickerInput
                  value={date}
                  onChange={setDate}
                  min={new Date().toISOString().split("T")[0]}
                  placeholder={t("datePlaceholder")}
                  isActive={activeSeg === "date"}
                  onOpenChange={(open: boolean) => setActiveSeg(open ? "date" : null)}
                />
              </div>
            </div>
          </div>

          {/* ── Guests ── */}
          <div className={`relative flex-1 min-w-0 flex flex-col justify-center px-3 py-2.5 sm:px-4 sm:py-4 bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-sm border transition-colors hover:bg-white overflow-hidden ${activeSeg === "guests" ? "border-teal-500 shadow-teal-500/10" : "border-slate-100"}`}>
            <p className={`hidden sm:flex items-center gap-1.5 text-[10px] font-bold tracking-[0.15em] uppercase mb-1.5 transition-colors duration-150 ${activeSeg === "guests" ? "text-teal-600" : "text-slate-400"}`}>
              <Users className="h-3.5 w-3.5" />
              {t("guestsLabel")}
            </p>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setGuests((g) => Math.max(1, g - 1))}
                onFocus={() => setActiveSeg("guests")}
                onBlur={() => setActiveSeg(null)}
                aria-label={t("decreaseAriaLabel")}
                className="grid place-items-center h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-slate-100 text-slate-500 hover:bg-teal-50 hover:text-teal-600 transition-all active:scale-95"
              >
                <Minus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </button>
              <span className="text-[15px] font-bold text-slate-900 tabular-nums w-6 text-center select-none">
                {guests}
              </span>
              <button
                type="button"
                onClick={() => setGuests((g) => Math.min(20, g + 1))}
                onFocus={() => setActiveSeg("guests")}
                onBlur={() => setActiveSeg(null)}
                aria-label={t("increaseAriaLabel")}
                className="grid place-items-center h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-slate-100 text-slate-500 hover:bg-teal-50 hover:text-teal-600 transition-all active:scale-95"
              >
                <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Search Button ── */}
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 px-8 py-2.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-white text-[15px] sm:text-[16px] transition-all hover:-translate-y-0.5 active:scale-[0.98] shadow-lg shadow-teal-500/30"
          style={{ background: "linear-gradient(135deg, #2dd4bf 0%, #0d9488 100%)" }}
        >
          {t("buttonSearch")}
          <ArrowRight className="h-5 w-5" />
        </button>

      </form>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Search, MapPin, Calendar, Users, Plus, Minus, TrendingUp } from "lucide-react";

const DESTINATIONS = [
  { label: "Бали", sub: "Индонезия", country: "Bali" },
  { label: "Турция", sub: "Анталия · Стамбул", country: "Turkey" },
  { label: "Дубай", sub: "ОАЭ", country: "UAE" },
  { label: "Мальдивы", sub: "Индийский океан", country: "Maldives" },
  { label: "Таиланд", sub: "Бангкок · Пхукет", country: "Thailand" },
  { label: "Египет", sub: "Хургада · Шарм-эль-Шейх", country: "Egypt" },
  { label: "Греция", sub: "Санторини · Миконос", country: "Greece" },
  { label: "Япония", sub: "Токио · Киото", country: "Japan" },
  { label: "Грузия", sub: "Тбилиси · Батуми", country: "Georgia" },
  { label: "Италия", sub: "Рим · Милан · Венеция", country: "Italy" },
];

export function SearchForm() {
  const router = useRouter();
  const locale = useLocale();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeSeg, setActiveSeg] = useState<"dest" | "date" | "guests" | null>(null);

  const suggestions = DESTINATIONS.filter(
    (d) =>
      !query ||
      d.label.toLowerCase().includes(query.toLowerCase()) ||
      d.sub.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setActiveSeg(null);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) {
      // Pass Russian label as display, English country value for the API
      params.set("q", query);
      if (selectedCountry) {
        params.set("country", selectedCountry);
      } else {
        // Free-text: try to match a known destination, otherwise pass as-is
        const match = DESTINATIONS.find(
          (d) => d.label.toLowerCase() === query.toLowerCase(),
        );
        params.set("country", match?.country ?? query);
      }
    }
    if (date) params.set("date", date);
    if (guests > 1) params.set("guests", String(guests));
    router.push(`/${locale}/tours?${params.toString()}`);
  };

  const pickDestination = (label: string, country: string) => {
    setQuery(label);
    setSelectedCountry(country);
    setDropdownOpen(false);
    setActiveSeg(null);
  };

  const isActive = activeSeg !== null;

  return (
    <div ref={wrapperRef} className="relative">
      {/* Glow ring on focus */}
      <div
        aria-hidden
        className={`absolute inset-[-3px] rounded-[22px] transition-opacity duration-300 pointer-events-none ${isActive ? "opacity-100" : "opacity-0"}`}
        style={{
          background: "linear-gradient(135deg, #0d9488, #0284c7, #8b5cf6)",
          filter: "blur(10px)",
        }}
      />

      <form
        onSubmit={handleSubmit}
        className={`relative flex flex-col md:flex-row items-stretch bg-white rounded-2xl overflow-visible transition-shadow duration-300 ${
          isActive
            ? "shadow-[0_24px_64px_-16px_rgba(0,0,0,0.55),0_0_0_2px_rgba(13,148,136,0.3)]"
            : "shadow-[0_24px_64px_-16px_rgba(0,0,0,0.5)]"
        }`}
      >

        {/* ── Destination ── */}
        <label
          className={`relative flex items-center gap-3 px-5 py-4 md:py-5 flex-1 min-w-0 cursor-text transition-colors rounded-t-2xl md:rounded-tr-none md:rounded-l-2xl ${
            activeSeg === "dest" ? "bg-teal-50/60" : "hover:bg-slate-50/70"
          }`}
        >
          <div
            className={`shrink-0 grid place-items-center h-11 w-11 rounded-xl transition-all ${
              activeSeg === "dest"
                ? "bg-teal-500 text-white shadow-[0_6px_16px_-4px_rgba(13,148,136,0.5)]"
                : "bg-rose-50 text-rose-500"
            }`}
          >
            <MapPin className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-0.5">
              Куда едем?
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedCountry(null);
                setDropdownOpen(true);
              }}
              onFocus={() => {
                setActiveSeg("dest");
                setDropdownOpen(true);
              }}
              placeholder="Страна, город или тур…"
              className="w-full bg-transparent text-[15px] font-semibold text-slate-900 placeholder:text-slate-400 outline-none"
              autoComplete="off"
            />
          </div>

          {/* Autocomplete dropdown */}
          {dropdownOpen && activeSeg === "dest" && (
            <div
              className="absolute top-[calc(100%+6px)] left-0 w-full md:w-96 z-50 rounded-2xl bg-white shadow-[0_20px_60px_-10px_rgba(15,23,42,0.28)] ring-1 ring-slate-100 overflow-hidden"
              onMouseDown={(e) => e.preventDefault()}
            >
              <div className="px-4 pt-3 pb-2 flex items-center gap-1.5 border-b border-slate-50">
                <TrendingUp className="h-3.5 w-3.5 text-teal-600" />
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  {query ? "Результаты поиска" : "Популярные направления"}
                </span>
              </div>
              {suggestions.length > 0 ? (
                <ul className="py-1.5">
                  {suggestions.slice(0, 8).map((d) => (
                    <li key={d.label}>
                      <button
                        type="button"
                        onMouseDown={() => pickDestination(d.label, d.country)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-teal-50 transition-colors text-left"
                      >
                        <div className="shrink-0 grid place-items-center h-9 w-9 rounded-xl bg-slate-100 text-slate-500">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{d.label}</p>
                          <p className="text-xs text-slate-500">{d.sub}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm font-medium text-slate-500">Направление не найдено</p>
                  <p className="text-xs text-slate-400 mt-0.5">Попробуйте другой запрос</p>
                </div>
              )}
            </div>
          )}
        </label>

        {/* Divider */}
        <div className="hidden md:block w-px bg-slate-100 shrink-0 my-3" aria-hidden />

        {/* ── Date ── */}
        <div
          className={`flex items-center gap-3 px-5 py-4 md:py-5 shrink-0 transition-colors ${
            activeSeg === "date" ? "bg-teal-50/60" : "hover:bg-slate-50/70"
          }`}
        >
          <div
            className={`shrink-0 grid place-items-center h-11 w-11 rounded-xl transition-all ${
              activeSeg === "date"
                ? "bg-teal-500 text-white shadow-[0_6px_16px_-4px_rgba(13,148,136,0.5)]"
                : "bg-teal-50 text-teal-600"
            }`}
          >
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-0.5">
              Когда едем?
            </p>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onFocus={() => setActiveSeg("date")}
              onBlur={() => setActiveSeg(null)}
              min={new Date().toISOString().split("T")[0]}
              className="bg-transparent text-[15px] font-semibold text-slate-900 outline-none w-36 scheme-light"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px bg-slate-100 shrink-0 my-3" aria-hidden />

        {/* ── Guests ── */}
        <div
          className={`flex items-center gap-3 px-5 py-4 md:py-5 shrink-0 transition-colors ${
            activeSeg === "guests" ? "bg-teal-50/60" : "hover:bg-slate-50/70"
          }`}
        >
          <div
            className={`shrink-0 grid place-items-center h-11 w-11 rounded-xl transition-all ${
              activeSeg === "guests"
                ? "bg-teal-500 text-white shadow-[0_6px_16px_-4px_rgba(13,148,136,0.5)]"
                : "bg-amber-50 text-amber-500"
            }`}
          >
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-1">
              Гости
            </p>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setGuests((g) => Math.max(1, g - 1))}
                onFocus={() => setActiveSeg("guests")}
                onBlur={() => setActiveSeg(null)}
                aria-label="Уменьшить"
                className="grid place-items-center h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="text-[15px] font-bold text-slate-900 tabular-nums w-4 text-center">
                {guests}
              </span>
              <button
                type="button"
                onClick={() => setGuests((g) => Math.min(20, g + 1))}
                onFocus={() => setActiveSeg("guests")}
                onBlur={() => setActiveSeg(null)}
                aria-label="Увеличить"
                className="grid place-items-center h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Search Button ── */}
        <button
          type="submit"
          className="flex items-center justify-center gap-2.5 px-8 py-4 md:py-5 rounded-b-2xl md:rounded-b-none md:rounded-r-2xl font-bold text-white text-[15px] transition-all hover:opacity-95 active:scale-[0.98] whitespace-nowrap min-w-[148px]"
          style={{
            background: "linear-gradient(135deg, #0d9488 0%, #0284c7 100%)",
          }}
        >
          <Search className="h-5 w-5" />
          Найти тур
        </button>
      </form>
    </div>
  );
}

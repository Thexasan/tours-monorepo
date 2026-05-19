"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { MapPin, Calendar, Users, Plus, Minus, ArrowRight, Compass } from "lucide-react";

const DESTINATIONS = [
  { label: "Бали", sub: "Индонезия", country: "Bali", color: "bg-emerald-500" },
  { label: "Турция", sub: "Анталия · Стамбул", country: "Turkey", color: "bg-red-500" },
  { label: "Дубай", sub: "ОАЭ", country: "UAE", color: "bg-amber-500" },
  { label: "Мальдивы", sub: "Индийский океан", country: "Maldives", color: "bg-sky-500" },
  { label: "Таиланд", sub: "Бангкок · Пхукет", country: "Thailand", color: "bg-violet-500" },
  { label: "Египет", sub: "Хургада · Шарм-эль-Шейх", country: "Egypt", color: "bg-orange-500" },
  { label: "Греция", sub: "Санторини · Миконос", country: "Greece", color: "bg-blue-500" },
  { label: "Япония", sub: "Токио · Киото", country: "Japan", color: "bg-rose-500" },
  { label: "Грузия", sub: "Тбилиси · Батуми", country: "Georgia", color: "bg-pink-500" },
  { label: "Италия", sub: "Рим · Милан · Венеция", country: "Italy", color: "bg-green-600" },
];

function formatRuDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

export function SearchForm() {
  const router = useRouter();
  const locale = useLocale();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

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
      params.set("q", query);
      if (selectedCountry) {
        params.set("country", selectedCountry);
      } else {
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

  return (
    <div ref={wrapperRef} className="relative w-full">
      <form
        onSubmit={handleSubmit}
        className="relative flex flex-col md:flex-row items-stretch bg-white/[0.97] backdrop-blur-sm rounded-2xl border border-white/70 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.38),0_4px_20px_-4px_rgba(0,0,0,0.12)] overflow-visible"
      >

        {/* ── Destination ── */}
        {/* Outer wrapper is overflow-visible so the dropdown can escape */}
        <div className="relative flex-1 min-w-0">
          {/* label has overflow-hidden so the active underline is clipped by border-radius */}
          <label className="relative flex flex-col justify-center px-6 py-5 h-full cursor-text rounded-t-2xl md:rounded-tr-none md:rounded-l-2xl hover:bg-slate-50/70 transition-colors overflow-hidden">
            <span
              className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.18em] uppercase mb-2 transition-colors duration-150"
              style={{ color: activeSeg === "dest" ? "#0d9488" : "#94a3b8" }}
            >
              <MapPin className="h-3 w-3" />
              Направление
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
              placeholder="Куда отправимся?"
              className="w-full bg-transparent text-[17px] font-semibold text-slate-900 placeholder:text-slate-300 outline-none"
              autoComplete="off"
            />

            {/* Active underline — clipped cleanly by label's overflow-hidden + border-radius */}
            <div
              className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-teal-500 origin-left transition-all duration-200"
              style={{
                opacity: activeSeg === "dest" ? 1 : 0,
                transform: activeSeg === "dest" ? "scaleX(1)" : "scaleX(0)",
              }}
            />
          </label>

          {/* Dropdown lives outside the label so it's not clipped */}
          {dropdownOpen && activeSeg === "dest" && (
            <div
              className="absolute top-[calc(100%+8px)] left-0 w-full md:w-[340px] z-50 rounded-2xl bg-white shadow-[0_20px_56px_-12px_rgba(15,23,42,0.2),0_4px_16px_-4px_rgba(15,23,42,0.08)] border border-slate-100 overflow-hidden"
              onMouseDown={(e) => e.preventDefault()}
            >
              <div className="px-5 py-3 border-b border-slate-100">
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  {query ? "Результаты поиска" : "Популярные направления"}
                </p>
              </div>

              {suggestions.length > 0 ? (
                <ul className="py-2">
                  {suggestions.slice(0, 8).map((d) => (
                    <li key={d.label}>
                      <button
                        type="button"
                        onMouseDown={() => pickDestination(d.label, d.country)}
                        className="w-full flex items-center gap-3.5 px-5 py-2.5 hover:bg-teal-50/60 transition-colors text-left group"
                      >
                        <div
                          className={`shrink-0 grid place-items-center h-10 w-10 rounded-xl ${d.color} text-white text-sm font-bold shadow-sm select-none`}
                        >
                          {d.label.slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-semibold text-slate-800 group-hover:text-teal-700 transition-colors">
                            {d.label}
                          </p>
                          <p className="text-[12px] text-slate-400 truncate leading-tight">{d.sub}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-5 py-8 text-center">
                  <Compass className="h-9 w-9 text-slate-200 mx-auto mb-2.5" />
                  <p className="text-[13px] font-semibold text-slate-500">Направление не найдено</p>
                  <p className="text-[12px] text-slate-400 mt-0.5">Попробуйте другой запрос</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Desktop divider */}
        <div className="hidden md:flex items-stretch py-4 shrink-0" aria-hidden>
          <div className="w-px bg-linear-to-b from-transparent via-slate-200 to-transparent" />
        </div>
        {/* Mobile divider */}
        <div className="md:hidden h-px mx-5 bg-slate-100" aria-hidden />

        {/* ── Date ── */}
        <div className="relative flex flex-col justify-center px-6 py-5 shrink-0 hover:bg-slate-50/70 transition-colors cursor-pointer">
          <p
            className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.18em] uppercase mb-2 transition-colors duration-150"
            style={{ color: activeSeg === "date" ? "#0d9488" : "#94a3b8" }}
          >
            <Calendar className="h-3 w-3" />
            Дата вылета
          </p>

          {/* Custom formatted display */}
          <p
            className="text-[17px] font-semibold pointer-events-none select-none"
            style={{ color: date ? "#0f172a" : "#cbd5e1" }}
          >
            {date ? formatRuDate(date) : "Выбрать дату"}
          </p>

          {/* Native date input invisible, covers entire area */}
          <input
            ref={dateInputRef}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            onFocus={() => setActiveSeg("date")}
            onBlur={() => setActiveSeg(null)}
            min={new Date().toISOString().split("T")[0]}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            tabIndex={0}
            aria-label="Дата вылета"
          />

          {/* Active underline */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-teal-500 origin-left transition-all duration-200"
            style={{
              opacity: activeSeg === "date" ? 1 : 0,
              transform: activeSeg === "date" ? "scaleX(1)" : "scaleX(0)",
            }}
          />
        </div>

        {/* Desktop divider */}
        <div className="hidden md:flex items-stretch py-4 shrink-0" aria-hidden>
          <div className="w-px bg-linear-to-b from-transparent via-slate-200 to-transparent" />
        </div>
        {/* Mobile divider */}
        <div className="md:hidden h-px mx-5 bg-slate-100" aria-hidden />

        {/* ── Guests ── */}
        <div className="relative flex flex-col justify-center px-6 py-5 shrink-0 hover:bg-slate-50/70 transition-colors">
          <p
            className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.18em] uppercase mb-2 transition-colors duration-150"
            style={{ color: activeSeg === "guests" ? "#0d9488" : "#94a3b8" }}
          >
            <Users className="h-3 w-3" />
            Туристов
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setGuests((g) => Math.max(1, g - 1))}
              onFocus={() => setActiveSeg("guests")}
              onBlur={() => setActiveSeg(null)}
              aria-label="Уменьшить"
              className="grid place-items-center h-8 w-8 rounded-full border border-slate-200 text-slate-400 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-600 transition-all active:scale-95"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="text-[18px] font-bold text-slate-900 tabular-nums w-5 text-center select-none">
              {guests}
            </span>
            <button
              type="button"
              onClick={() => setGuests((g) => Math.min(20, g + 1))}
              onFocus={() => setActiveSeg("guests")}
              onBlur={() => setActiveSeg(null)}
              aria-label="Увеличить"
              className="grid place-items-center h-8 w-8 rounded-full border border-slate-200 text-slate-400 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-600 transition-all active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Active underline */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-teal-500 origin-left transition-all duration-200"
            style={{
              opacity: activeSeg === "guests" ? 1 : 0,
              transform: activeSeg === "guests" ? "scaleX(1)" : "scaleX(0)",
            }}
          />
        </div>

        {/* ── Search Button ── */}
        <div className="p-3 shrink-0">
          <button
            type="submit"
            className="h-full w-full flex items-center justify-center gap-2.5 px-8 rounded-[14px] font-bold text-white text-[15px] transition-all hover:opacity-90 active:scale-[0.97] whitespace-nowrap min-h-[60px]"
            style={{
              background: "linear-gradient(135deg, #0d9488 0%, #0369a1 100%)",
              boxShadow: "0 8px 24px -6px rgba(13,148,136,0.5)",
            }}
          >
            Найти тур
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
}

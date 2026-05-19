"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Popover as PopoverPrimitive } from "radix-ui";
import { MapPin, Calendar, Users, Plus, Minus, ArrowRight, Compass, X } from "lucide-react";
import { DatePickerInput } from "@/src/components/ui/date-picker-input";

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

export function SearchForm() {
  const router = useRouter();
  const locale = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState(1);
  const [destOpen, setDestOpen] = useState(false);
  const [activeSeg, setActiveSeg] = useState<"dest" | "date" | "guests" | null>(null);

  const suggestions = DESTINATIONS.filter(
    (d) =>
      !query ||
      d.label.toLowerCase().includes(query.toLowerCase()) ||
      d.sub.toLowerCase().includes(query.toLowerCase()),
  );

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
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">

        {/* ── Destination ── */}
        <PopoverPrimitive.Root
          open={destOpen}
          onOpenChange={(open) => {
            setDestOpen(open);
            if (open) setActiveSeg("dest");
          }}
        >
          <PopoverPrimitive.Anchor asChild>
            <div className={`relative flex flex-col justify-center px-5 py-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-sm border transition-colors cursor-text hover:bg-white overflow-hidden ${activeSeg === "dest" ? "border-teal-500 shadow-teal-500/10" : "border-slate-100"}`}>
              <span className={`flex items-center gap-1.5 text-[11px] font-bold tracking-[0.15em] uppercase mb-1.5 transition-colors duration-150 ${activeSeg === "dest" ? "text-teal-600" : "text-slate-400"}`}>
                <MapPin className="h-3.5 w-3.5" />
                Направление
              </span>

              <div className="flex items-center gap-2">
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
                  placeholder="Куда отправимся?"
                  className="flex-1 min-w-0 bg-transparent text-[16px] font-semibold text-slate-900 placeholder:text-slate-300 outline-none"
                  autoComplete="off"
                />
                {query && (
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); clearQuery(); }}
                    className="shrink-0 h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                    aria-label="Очистить"
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
              avoidCollisions
              collisionPadding={12}
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
                  {query ? "Результаты поиска" : "Популярные направления"}
                </p>
              </div>

              {suggestions.length > 0 ? (
                <ul className="py-2 max-h-[300px] overflow-y-auto overscroll-contain">
                  {suggestions.map((d) => (
                    <li key={d.label}>
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); pickDestination(d.label, d.country); }}
                        className="w-full flex items-center gap-3.5 px-5 py-2.5 hover:bg-teal-50/60 transition-colors text-left group"
                      >
                        <div className={`shrink-0 grid place-items-center h-10 w-10 rounded-xl ${d.color} text-white text-sm font-bold shadow-sm select-none`}>
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
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>

        <div className="flex gap-3">
          {/* ── Date ── */}
          <div className={`relative flex-1 min-w-0 flex flex-col justify-center px-4 py-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-sm border transition-colors hover:bg-white overflow-hidden ${activeSeg === "date" ? "border-teal-500 shadow-teal-500/10" : "border-slate-100"}`}>
            <p className={`flex items-center gap-1.5 text-[10px] font-bold tracking-[0.15em] uppercase mb-1.5 transition-colors duration-150 pointer-events-none ${activeSeg === "date" ? "text-teal-600" : "text-slate-400"}`}>
              <Calendar className="h-3.5 w-3.5" />
              Дата вылета
            </p>
            <DatePickerInput
              value={date}
              onChange={setDate}
              min={new Date().toISOString().split("T")[0]}
              placeholder="Выбрать"
              isActive={activeSeg === "date"}
              onOpenChange={(open: boolean) => setActiveSeg(open ? "date" : null)}
            />
          </div>

          {/* ── Guests ── */}
          <div className={`relative flex-1 min-w-0 flex flex-col justify-center px-4 py-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-sm border transition-colors hover:bg-white overflow-hidden ${activeSeg === "guests" ? "border-teal-500 shadow-teal-500/10" : "border-slate-100"}`}>
            <p className={`flex items-center gap-1.5 text-[10px] font-bold tracking-[0.15em] uppercase mb-1.5 transition-colors duration-150 ${activeSeg === "guests" ? "text-teal-600" : "text-slate-400"}`}>
              <Users className="h-3.5 w-3.5" />
              Туристов
            </p>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setGuests((g) => Math.max(1, g - 1))}
                onFocus={() => setActiveSeg("guests")}
                onBlur={() => setActiveSeg(null)}
                aria-label="Уменьшить"
                className="grid place-items-center h-8 w-8 rounded-full bg-slate-100 text-slate-500 hover:bg-teal-50 hover:text-teal-600 transition-all active:scale-95"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="text-[17px] font-bold text-slate-900 tabular-nums w-6 text-center select-none">
                {guests}
              </span>
              <button
                type="button"
                onClick={() => setGuests((g) => Math.min(20, g + 1))}
                onFocus={() => setActiveSeg("guests")}
                onBlur={() => setActiveSeg(null)}
                aria-label="Увеличить"
                className="grid place-items-center h-8 w-8 rounded-full bg-slate-100 text-slate-500 hover:bg-teal-50 hover:text-teal-600 transition-all active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Search Button ── */}
        <button
          type="submit"
          className="mt-1 w-full flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-white text-[16px] transition-all hover:-translate-y-0.5 active:scale-[0.98] shadow-lg shadow-teal-500/30"
          style={{ background: "linear-gradient(135deg, #2dd4bf 0%, #0d9488 100%)" }}
        >
          Найти тур
          <ArrowRight className="h-5 w-5" />
        </button>

      </form>
    </div>
  );
}

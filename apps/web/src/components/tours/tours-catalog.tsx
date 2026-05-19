"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import {
  Search, Filter, Star, ChevronLeft, ChevronRight,
  MapPin, X, SlidersHorizontal, ArrowUpRight, Sparkles, Compass,
  Shield, Award, Headphones,
} from "lucide-react";
import type { Tour } from "@tours/types";
import { apiClient } from "@/src/shared/api/apiClient";
import { TourCard, TourCardSkeleton } from "./tour-card";

interface ListResponse {
  items: Tour[];
  total: number;
  page: number;
  pageSize: number;
}

interface Filters {
  country: string;
  minPrice: string;
  maxPrice: string;
  hotelStars: string;
  mealPlan: string;
  sort: "newest" | "price_asc" | "price_desc" | "popular";
}

const DEFAULT_FILTERS: Filters = {
  country: "",
  minPrice: "",
  maxPrice: "",
  hotelStars: "",
  mealPlan: "",
  sort: "newest",
};

const POPULAR_COUNTRIES = [
  { label: "Все", value: "" },
  { label: "Турция", value: "Turkey" },
  { label: "Греция", value: "Greece" },
  { label: "Япония", value: "Japan" },
  { label: "Грузия", value: "Georgia" },
  { label: "Италия", value: "Italy" },
  { label: "ОАЭ", value: "UAE" },
  { label: "Мальдивы", value: "Maldives" },
  { label: "Таиланд", value: "Thailand" },
  { label: "Египет", value: "Egypt" },
];

const SORT_OPTIONS: { value: Filters["sort"]; label: string }[] = [
  { value: "newest", label: "Сначала новые" },
  { value: "price_asc", label: "Дешевле" },
  { value: "price_desc", label: "Дороже" },
  { value: "popular", label: "Популярные" },
];

const MEAL_OPTIONS = [
  { value: "", label: "Любое" },
  { value: "ALL_INCLUSIVE", label: "Всё включено" },
  { value: "HALF_BOARD", label: "Полупансион" },
  { value: "BREAKFAST", label: "Завтраки" },
  { value: "NO_MEALS", label: "Без питания" },
];

export function ToursCatalog() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const urlCountry = searchParams.get("country") ?? "";
  const urlLabel = searchParams.get("q") ?? "";

  // Booking intent params — carried from homepage search to tour page
  const bookingParams = new URLSearchParams();
  const urlDate = searchParams.get("date") ?? "";
  const urlGuests = searchParams.get("guests") ?? "";
  if (urlDate) bookingParams.set("date", urlDate);
  if (urlGuests) bookingParams.set("guests", urlGuests);
  const bookingQuery = bookingParams.toString();
  const [filters, setFilters] = useState<Filters>({
    ...DEFAULT_FILTERS,
    country: urlCountry,
  });
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const queryParams = useMemo(() => {
    const p: Record<string, string> = { page: String(page), pageSize: "12", sort: filters.sort };
    if (filters.country) p.country = filters.country;
    if (filters.minPrice) p.minPrice = filters.minPrice;
    if (filters.maxPrice) p.maxPrice = filters.maxPrice;
    if (filters.hotelStars) p.hotelStars = filters.hotelStars;
    if (filters.mealPlan) p.mealPlan = filters.mealPlan;
    return p;
  }, [filters, page]);

  const { data, isLoading, isError } = useQuery<ListResponse>({
    queryKey: ["tours", queryParams],
    queryFn: async () => {
      const { data } = await apiClient.get<ListResponse>("/tours", { params: queryParams });
      return data;
    },
  });

  const update = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: value }));
  };

  const activeFiltersCount =
    (filters.country ? 1 : 0) +
    (filters.minPrice ? 1 : 0) +
    (filters.maxPrice ? 1 : 0) +
    (filters.hotelStars ? 1 : 0) +
    (filters.mealPlan ? 1 : 0);

  return (
    <div className="-mt-16 bg-white">
      <CatalogHero locale={locale} />

      <div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 -mt-12 md:-mt-16 relative z-10">
        <CountryChips
          value={filters.country}
          onChange={(v) => update("country", v)}
        />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 pt-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-[290px_1fr] gap-8">
          <FiltersPanel
            filters={filters}
            update={update}
            reset={() => setFilters(DEFAULT_FILTERS)}
            activeCount={activeFiltersCount}
            mobileOpen={mobileFiltersOpen}
            setMobileOpen={setMobileFiltersOpen}
          />

          <div className="min-w-0">
            {urlLabel && filters.country && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-slate-500">Поиск:</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-sm font-semibold ring-1 ring-orange-200">
                  <MapPin className="h-3.5 w-3.5" />
                  {urlLabel}
                  <button
                    type="button"
                    aria-label="Сбросить поиск"
                    onClick={() => update("country", "")}
                    className="ml-0.5 grid place-items-center h-4 w-4 rounded-full hover:bg-orange-200 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              </div>
            )}

            <ResultsBar
              total={data?.total}
              isLoading={isLoading}
              filters={filters}
              update={update}
              openMobileFilters={() => setMobileFiltersOpen(true)}
              activeCount={activeFiltersCount}
            />

            {isError && (
              <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4 text-rose-700 text-sm flex items-start gap-2">
                <X className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Не удалось загрузить туры. Проверьте, запущен ли API.</span>
              </div>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <TourCardSkeleton key={i} />
                ))}
              </div>
            ) : data && data.items.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {data.items.map((t) => <TourCard key={t.id} tour={t} extraQuery={bookingQuery} />)}
                </div>

                {data.total > data.pageSize && (
                  <Pagination
                    page={data.page}
                    pageSize={data.pageSize}
                    total={data.total}
                    onPrev={() => setPage((p) => Math.max(1, p - 1))}
                    onNext={() => setPage((p) => p + 1)}
                  />
                )}
              </>
            ) : (
              <EmptyState onReset={() => setFilters(DEFAULT_FILTERS)} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CatalogHero({ locale }: { locale: string }) {
  return (
    <section className="pt-20 pb-4 px-4 md:px-6 lg:px-8 max-w-[1600px] mx-auto relative z-0">
      <div className="relative w-full h-[500px] md:h-[600px] rounded-[3rem] overflow-hidden shadow-2xl">
        <Image
          src="https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=2000&q=85&auto=format&fit=crop"
          alt="Tours Hero"
          fill
          priority
          className="object-cover transition-transform duration-1000 hover:scale-105"
          sizes="100vw"
        />
        
        {/* Dark neutral base — photo shows through beautifully */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-[#0B0F19]/90 via-[#0B0F19]/30 to-transparent"
        />
        
        <div className="absolute inset-0 p-8 md:p-16 flex flex-col justify-end">
          <div className="max-w-4xl">
             <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white mb-6 shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" /> 50+ направлений по всему миру
             </div>
             
             <h1 className="text-5xl md:text-6xl lg:text-[80px] font-black text-white tracking-tight leading-[1.05] mb-6 drop-shadow-lg">
               Найди свой <br/>
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-orange-400">
                 идеальный тур.
               </span>
             </h1>
             
             <p className="text-lg md:text-xl text-white/80 max-w-xl font-medium leading-relaxed drop-shadow">
                Горящие предложения, проверенные отели и прозрачные цены. Начните свое незабываемое путешествие прямо сейчас.
             </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CountryChips({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex justify-center -mt-14 md:-mt-16 relative z-20 pb-12 px-4">
      <div className="rounded-[2.5rem] bg-white/70 backdrop-blur-2xl p-2 md:p-2.5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] ring-1 ring-slate-200/50 flex items-center max-w-full overflow-x-auto" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {POPULAR_COUNTRIES.map((c) => {
          const active = value === c.value;
          return (
            <button
              key={c.label}
              type="button"
              onClick={() => onChange(c.value)}
              className={`shrink-0 px-5 md:px-6 py-3 rounded-[2rem] text-[13px] md:text-sm font-bold transition-all duration-300 ${
                active
                  ? "bg-slate-900 text-white shadow-xl scale-100"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 scale-[0.98]"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FiltersPanel({
  filters, update, reset, activeCount, mobileOpen, setMobileOpen,
}: {
  filters: Filters;
  update: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  reset: () => void;
  activeCount: number;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}) {
  const content = (
    <>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-orange-600" />
          Фильтры
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold rounded-full bg-orange-600 text-white">
              {activeCount}
            </span>
          )}
        </h3>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={reset}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700"
          >
            Сбросить
          </button>
        )}
      </div>

      <FilterGroup label="Страна">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={filters.country}
            onChange={(e) => update("country", e.target.value)}
            placeholder="Например: Турция"
            className="w-full h-11 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all hover:border-slate-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15"
          />
        </div>
      </FilterGroup>

      <FilterGroup label="Цена, $">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min={0}
            value={filters.minPrice}
            onChange={(e) => update("minPrice", e.target.value)}
            placeholder="от"
            className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all hover:border-slate-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15"
          />
          <input
            type="number"
            min={0}
            value={filters.maxPrice}
            onChange={(e) => update("maxPrice", e.target.value)}
            placeholder="до"
            className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all hover:border-slate-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15"
          />
        </div>
      </FilterGroup>

      <FilterGroup label="Звёздность отеля">
        <div className="flex flex-wrap gap-1.5">
          {[
            { v: "", label: "Любая" },
            { v: "3", label: "3" },
            { v: "4", label: "4" },
            { v: "5", label: "5" },
          ].map(({ v, label }) => {
            const active = filters.hotelStars === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => update("hotelStars", v)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  active
                    ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {label}
                {v && <Star className={`h-3 w-3 ${active ? "fill-amber-400 text-amber-400" : ""}`} />}
              </button>
            );
          })}
        </div>
      </FilterGroup>

      <FilterGroup label="Питание">
        <div className="flex flex-col gap-1.5">
          {MEAL_OPTIONS.map((m) => {
            const active = filters.mealPlan === m.value;
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => update("mealPlan", m.value)}
                className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-orange-50 text-orange-700 ring-1 ring-orange-200"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </FilterGroup>
    </>
  );

  return (
    <>
      <aside className="hidden lg:block">
        <div className="lg:sticky lg:top-28 pr-6 border-r border-slate-100">
          {content}
        </div>
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="relative ml-auto w-[88%] max-w-sm bg-white h-full overflow-y-auto p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 grid place-items-center h-9 w-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
              aria-label="Закрыть"
            >
              <X className="h-4 w-4" />
            </button>
            {content}
          </div>
        </div>
      )}
    </>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 pb-5 border-b border-slate-100 last:border-0 last:mb-0 last:pb-0">
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2.5">
        {label}
      </p>
      {children}
    </div>
  );
}

function ResultsBar({
  total, isLoading, filters, update, openMobileFilters, activeCount,
}: {
  total: number | undefined;
  isLoading: boolean;
  filters: Filters;
  update: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  openMobileFilters: () => void;
  activeCount: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={openMobileFilters}
          className="lg:hidden inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white ring-1 ring-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Filter className="h-4 w-4" />
          Фильтры
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-orange-600 text-white">
              {activeCount}
            </span>
          )}
        </button>
        <p className="text-sm text-slate-600">
          {isLoading ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
              Загрузка…
            </span>
          ) : (
            <>Найдено: <strong className="text-slate-900 tabular-nums">{total ?? 0}</strong></>
          )}
        </p>
      </div>

      <div className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-slate-100">
        {SORT_OPTIONS.map((s) => {
          const active = filters.sort === s.value;
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => update("sort", s.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                active
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <select
        value={filters.sort}
        onChange={(e) => update("sort", e.target.value as Filters["sort"])}
        className="md:hidden h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 outline-none"
      >
        {SORT_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
    </div>
  );
}

function Pagination({
  page, pageSize, total, onPrev, onNext,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      <button
        type="button"
        disabled={page === 1}
        onClick={onPrev}
        className="inline-flex items-center gap-1.5 px-4 h-11 rounded-xl bg-white ring-1 ring-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft className="h-4 w-4" />
        Назад
      </button>

      <div className="flex items-center gap-1">
        <span className="px-4 h-11 inline-flex items-center text-sm font-semibold text-slate-500">
          <strong className="text-slate-900 tabular-nums mr-1">{page}</strong>
          из
          <strong className="text-slate-900 tabular-nums ml-1">{totalPages}</strong>
        </span>
      </div>

      <button
        type="button"
        disabled={page * pageSize >= total}
        onClick={onNext}
        className="inline-flex items-center gap-1.5 px-4 h-11 rounded-xl text-white text-sm font-semibold shadow-[0_6px_20px_-6px_rgba(249,115,22,0.55)] hover:-translate-y-0.5 disabled:opacity-30 disabled:hover:translate-y-0 disabled:shadow-none transition-all"
        style={{ background: "linear-gradient(135deg, #f97316, #0284c7)" }}
      >
        Вперёд
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-14 text-center">
      <div
        className="mx-auto h-16 w-16 rounded-2xl grid place-items-center text-white shadow-[0_12px_28px_-8px_rgba(249,115,22,0.50)]"
        style={{ background: "linear-gradient(135deg, #f97316, #0284c7)" }}
      >
        <Compass className="h-7 w-7" />
      </div>
      <h3 className="mt-5 text-lg font-bold text-slate-900">Туров не найдено</h3>
      <p className="mt-2 text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">
        Попробуйте сменить страну, цену или сбросить все фильтры.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-[0_8px_20px_-6px_rgba(249,115,22,0.55)] hover:-translate-y-0.5 transition-all"
        style={{ background: "linear-gradient(135deg, #f97316, #0284c7)" }}
      >
        <ArrowUpRight className="h-4 w-4" />
        Сбросить фильтры
      </button>
    </div>
  );
}

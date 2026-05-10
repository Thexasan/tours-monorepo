"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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

export function ToursCatalog() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
      {/* Filters */}
      <aside className="bg-white rounded-xl border border-zinc-200 p-5 h-fit space-y-4">
        <h3 className="font-semibold text-zinc-900">Фильтры</h3>

        <div>
          <label className="block text-sm text-zinc-700 mb-1">Страна</label>
          <input
            type="text"
            value={filters.country}
            onChange={(e) => update("country", e.target.value)}
            placeholder="Турция, Египет..."
            className="w-full h-9 rounded-md border border-zinc-200 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm text-zinc-700 mb-1">Цена от $</label>
            <input
              type="number" min={0} value={filters.minPrice}
              onChange={(e) => update("minPrice", e.target.value)}
              className="w-full h-9 rounded-md border border-zinc-200 px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-700 mb-1">До $</label>
            <input
              type="number" min={0} value={filters.maxPrice}
              onChange={(e) => update("maxPrice", e.target.value)}
              className="w-full h-9 rounded-md border border-zinc-200 px-3 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-zinc-700 mb-1">Звёздность</label>
          <select
            value={filters.hotelStars}
            onChange={(e) => update("hotelStars", e.target.value)}
            className="w-full h-9 rounded-md border border-zinc-200 px-3 text-sm bg-white"
          >
            <option value="">Любая</option>
            <option value="3">3★</option>
            <option value="4">4★</option>
            <option value="5">5★</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-zinc-700 mb-1">Питание</label>
          <select
            value={filters.mealPlan}
            onChange={(e) => update("mealPlan", e.target.value)}
            className="w-full h-9 rounded-md border border-zinc-200 px-3 text-sm bg-white"
          >
            <option value="">Любое</option>
            <option value="ALL_INCLUSIVE">Всё включено</option>
            <option value="HALF_BOARD">Полупансион</option>
            <option value="BREAKFAST">Завтраки</option>
            <option value="NO_MEALS">Без питания</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => setFilters(DEFAULT_FILTERS)}
          className="text-sm text-blue-600 hover:underline"
        >
          Сбросить фильтры
        </button>
      </aside>

      {/* Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-zinc-600">
            {data ? `Найдено: ${data.total}` : "Загрузка..."}
          </p>
          <select
            value={filters.sort}
            onChange={(e) => update("sort", e.target.value as Filters["sort"])}
            className="h-9 rounded-md border border-zinc-200 px-3 text-sm bg-white"
          >
            <option value="newest">Сначала новые</option>
            <option value="price_asc">Дешевле</option>
            <option value="price_desc">Дороже</option>
            <option value="popular">Популярные</option>
          </select>
        </div>

        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
            Не удалось загрузить туры. Проверь, запущен ли API.
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
              {data.items.map((t) => <TourCard key={t.id} tour={t} />)}
            </div>

            {data.total > data.pageSize && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-4 py-2 border rounded-md text-sm disabled:opacity-40"
                >
                  Назад
                </button>
                <span className="px-4 py-2 text-sm">
                  Стр. {data.page} из {Math.ceil(data.total / data.pageSize)}
                </span>
                <button
                  type="button"
                  disabled={page * data.pageSize >= data.total}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 border rounded-md text-sm disabled:opacity-40"
                >
                  Вперёд
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center text-zinc-500">
            Туров по выбранным фильтрам не найдено.
          </div>
        )}
      </div>
    </div>
  );
}

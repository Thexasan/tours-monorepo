"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type Currency = "USD" | "EUR" | "RUB";

interface CurrencyStore {
  currency: Currency;
  rates: { eur: number; rub: number };
  setCurrency: (c: Currency) => void;
  setRates: (r: { eur: number; rub: number }) => void;
  /** amountUsd → amount в выбранной валюте */
  convert: (amountUsd: number) => number;
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set, get) => ({
      currency: "USD",
      rates: { eur: 0.92, rub: 92 },
      setCurrency: (currency) => set({ currency }),
      setRates: (rates) => set({ rates }),
      convert: (amountUsd) => {
        const { currency, rates } = get();
        if (currency === "EUR") return amountUsd * rates.eur;
        if (currency === "RUB") return amountUsd * rates.rub;
        return amountUsd;
      },
    }),
    {
      name: "tours-currency-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ currency: state.currency }),
    },
  ),
);

"use client";

import { useCurrencyStore, type Currency } from "@/src/shared/store/currency-store";

const CURRENCIES: Currency[] = ["USD", "EUR", "RUB"];

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrencyStore();

  return (
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value as Currency)}
      className="h-9 rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
    >
      {CURRENCIES.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}

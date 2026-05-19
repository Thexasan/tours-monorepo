"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useCurrencyStore, type Currency } from "@/src/shared/store/currency-store";

const CURRENCIES: Currency[] = ["USD", "EUR", "RUB"];

interface Props {
  transparent?: boolean;
}

export function CurrencySelector({ transparent = false }: Props) {
  const { currency, setCurrency } = useCurrencyStore();

  return (
    <div className="relative flex items-center px-2">
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value as Currency)}
        className={cn(
          "appearance-none bg-transparent border-none outline-none cursor-pointer pl-0 pr-4 text-[11px] font-bold h-7 transition-colors",
          transparent
            ? "text-white/80 hover:text-white"
            : "text-slate-600 hover:text-slate-900",
        )}
      >
        {CURRENCIES.map((c) => (
          <option key={c} value={c} className="text-slate-900 bg-white font-medium">
            {c}
          </option>
        ))}
      </select>
      <ChevronDown
        className={cn(
          "absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none shrink-0",
          transparent ? "text-white/50" : "text-slate-400",
        )}
      />
    </div>
  );
}

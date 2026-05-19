"use client";

import { useState } from "react";
import { ChevronDown, Compass } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/src/lib/utils";

export interface ItineraryDay {
  day: number;
  title: string;
  desc: string;
}

export function TourItinerary({
  days,
  durationDays,
  durationNights,
}: {
  days: ItineraryDay[];
  durationDays: number;
  durationNights: number;
}) {
  const t = useTranslations("tours");
  const [openDays, setOpenDays] = useState(new Set<number>([1, 2]));

  function toggle(day: number) {
    setOpenDays(prev => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  if (!days.length) return null;

  return (
    <section>
      <div className="flex items-end justify-between gap-3 flex-wrap mb-7">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{t("detail.itinerary.title")}</h2>
          <p className="mt-2 text-slate-600">
            {durationDays} {t("detail.days")}, {durationNights} {t("detail.nights")} · {t("detail.itinerary.subtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOpenDays(new Set(days.map(d => d.day)))}
            className="text-xs font-semibold text-orange-700 px-3 py-1.5 rounded-full ring-1 ring-orange-100 hover:bg-orange-50 transition"
          >
            {t("detail.itinerary.expandAll")}
          </button>
          <button
            type="button"
            onClick={() => setOpenDays(new Set())}
            className="text-xs font-semibold text-slate-500 px-3 py-1.5 rounded-full ring-1 ring-slate-200 hover:bg-slate-50 transition"
          >
            {t("detail.itinerary.collapseAll")}
          </button>
        </div>
      </div>

      <ol className="relative">
        <span aria-hidden className="absolute left-[19px] top-3 bottom-3 w-px bg-linear-to-b from-orange-300 via-sky-300 to-rose-200" />
        {days.map((d) => {
          const open = openDays.has(d.day);
          return (
            <li key={d.day} className="relative pl-12 pb-3">
              <div className="absolute left-0 top-2">
                <div
                  className={cn(
                    "relative grid place-items-center h-10 w-10 rounded-full transition-all",
                    open
                      ? "bg-linear-to-br from-orange-500 to-sky-600 text-white shadow-[0_10px_24px_-8px_rgba(249,115,22,0.5)]"
                      : "bg-white ring-1 ring-slate-200 text-slate-500",
                  )}
                >
                  <Compass className="h-4 w-4" />
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggle(d.day)}
                className={cn(
                  "w-full text-left rounded-2xl bg-white ring-1 transition-all overflow-hidden",
                  open ? "ring-orange-200 shadow-[0_10px_28px_-12px_rgba(249,115,22,0.25)]" : "ring-slate-100 hover:ring-slate-200",
                )}
              >
                <div className="flex items-center gap-4 px-5 py-4">
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-[0.14em] tabular-nums px-2.5 py-1 rounded-full shrink-0",
                      open ? "bg-orange-50 text-orange-700" : "bg-slate-100 text-slate-600",
                    )}
                  >
                    {t("detail.itinerary.dayLabel")} {String(d.day).padStart(2, "0")}
                  </span>
                  <p className="font-bold text-slate-900 text-[15px] truncate flex-1">{d.title}</p>
                  <ChevronDown className={cn("h-[18px] w-[18px] text-slate-400 transition-transform shrink-0", open && "rotate-180 text-orange-700")} />
                </div>
                <div className={cn("grid transition-[grid-template-rows] duration-300", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 pt-1 text-[15px] text-slate-600 leading-relaxed">{d.desc}</p>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

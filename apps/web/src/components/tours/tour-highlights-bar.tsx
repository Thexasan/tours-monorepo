"use client";

import { MapPin, Calendar, Users, Star } from "lucide-react";
import { useTranslations } from "next-intl";

interface Props {
  region: string;
  country: string;
  durationDays: number;
  durationNights: number;
  avgRating: number;
  reviewsCount: number;
  groupSize?: string;
}

export function TourHighlightsBar({
  region, country, durationDays, durationNights, avgRating, reviewsCount,
  groupSize = "2–14",
}: Props) {
  const t = useTranslations("tours");

  const items = [
    {
      Ic: MapPin,
      lbl: t("detail.direction"),
      val: region,
      sub: country,
      tone: "text-rose-500",
    },
    {
      Ic: Calendar,
      lbl: t("detail.duration"),
      val: `${durationDays} ${t("detail.days")}`,
      sub: `${durationNights} ${t("detail.nights")}`,
      tone: "text-orange-600",
    },
    {
      Ic: Users,
      lbl: t("detail.groupSize"),
      val: `${groupSize} ${t("detail.people")}`,
      sub: t("detail.smallGroup"),
      tone: "text-sky-600",
    },
    {
      Ic: Star,
      lbl: t("detail.rating"),
      val: avgRating.toFixed(2),
      sub: `${reviewsCount} ${t("detail.reviewsCount")}`,
      tone: "text-amber-500",
    },
  ];

  return (
    <section className="relative z-20 -mt-8 md:-mt-12">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-200 rounded-2xl overflow-hidden ring-1 ring-slate-200 shadow-[0_20px_40px_-20px_rgba(15,23,42,0.25)]">
          {items.map((h, i) => (
            <div key={i} className="bg-white px-6 py-6 flex items-center gap-4">
              <div className={`grid place-items-center h-11 w-11 rounded-2xl bg-slate-50 ring-1 ring-slate-100 ${h.tone} shrink-0`}>
                <h.Ic className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{h.lbl}</p>
                <p className="font-bold text-slate-900 text-[15px] leading-tight mt-0.5 truncate">{h.val}</p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{h.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

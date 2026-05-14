import { MapPin, Calendar, Users, Star } from "lucide-react";

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
  const items = [
    { Ic: MapPin, lbl: "Направление", val: region, sub: country, tone: "text-rose-500" },
    { Ic: Calendar, lbl: "Длительность", val: `${durationDays} дней`, sub: `${durationNights} ночей`, tone: "text-teal-600" },
    { Ic: Users, lbl: "Размер группы", val: `${groupSize} чел`, sub: "малая группа", tone: "text-sky-600" },
    { Ic: Star, lbl: "Рейтинг", val: avgRating.toFixed(2), sub: `${reviewsCount} отзывов`, tone: "text-amber-500" },
  ];
  return (
    <section className="relative z-20 -mt-8 md:-mt-12">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-200 rounded-2xl overflow-hidden ring-1 ring-slate-200 shadow-[0_20px_40px_-20px_rgba(15,23,42,0.25)]">
          {items.map((h, i) => (
            <div key={i} className="bg-white px-5 py-5 flex items-center gap-4">
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

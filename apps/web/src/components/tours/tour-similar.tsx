import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { type Tour } from "@tours/types";
import { TourCard } from "@/src/components/tours/tour-card";

export function TourSimilar({ tours, locale }: { tours: Tour[]; locale: string }) {
  if (!tours.length) return null;
  return (
    <section className="bg-linear-to-b from-white to-slate-50/50 border-t border-slate-100">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-16 md:py-20">
        <div className="flex items-end justify-between gap-3 flex-wrap mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-700">Похожие туры</p>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight">Вам также понравится</h2>
          </div>
          <Link
            href={`/${locale}/tours`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-orange-700 hover:text-teal-800 transition-colors"
          >
            Все туры <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tours.slice(0, 3).map(t => <TourCard key={t.id} tour={t} />)}
        </div>
      </div>
    </section>
  );
}

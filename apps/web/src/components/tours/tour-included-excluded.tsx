"use client";

import { Check, X, CheckCircle2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

export function TourIncludedExcluded({
  included, excluded,
}: { included: string[]; excluded: string[] }) {
  const t = useTranslations("tours");

  if (!included.length && !excluded.length) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {included.length > 0 && (
        <div className="rounded-2xl bg-linear-to-br from-emerald-50/60 to-white ring-1 ring-emerald-100/80 p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <span className="grid place-items-center h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700">
              <Check className="h-[18px] w-[18px]" strokeWidth={2.5} />
            </span>
            <h3 className="font-bold text-slate-900 text-lg">{t("detail.included")}</h3>
          </div>
          <ul className="space-y-2.5">
            {included.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[15px] text-slate-700">
                <CheckCircle2 className="h-[18px] w-[18px] text-emerald-600 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {excluded.length > 0 && (
        <div className="rounded-2xl bg-linear-to-br from-rose-50/40 to-white ring-1 ring-rose-100/80 p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <span className="grid place-items-center h-9 w-9 rounded-xl bg-rose-100 text-rose-600">
              <X className="h-[18px] w-[18px]" strokeWidth={2.5} />
            </span>
            <h3 className="font-bold text-slate-900 text-lg">{t("detail.excluded")}</h3>
          </div>
          <ul className="space-y-2.5">
            {excluded.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[15px] text-slate-700">
                <XCircle className="h-[18px] w-[18px] text-rose-500 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Calendar, Users, Heart, Plus, Minus, ArrowRight,
  Shield, Award, Headphones, Sparkles, Tag, Share2, Copy, Check,
} from "lucide-react";
import { BookingModal } from "@/src/components/bookings/booking-modal";
import { cn } from "@/src/lib/utils";

interface Props {
  tourId: string;
  tourTitle: string;
  tourSlug: string;
  pricePerPerson: number;
  oldPrice?: number;
  coverImage: string;
  country: string;
  hotelStars: number;
  durationDays: number;
  referralReward?: number;
}

export function TourBookingSidebar({
  tourId, tourTitle, tourSlug, pricePerPerson, oldPrice,
  coverImage, country, hotelStars, durationDays, referralReward = 50,
}: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [guests, setGuests] = useState(1);
  const [departDate, setDepartDate] = useState("");
  const [wishlisted, setWishlisted] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const totalEstimate = pricePerPerson * guests;
  const savings = oldPrice ? (oldPrice - pricePerPerson) * guests : 0;
  const discount = oldPrice ? Math.round((1 - pricePerPerson / oldPrice) * 100) : 0;

  function copyReferral() {
    const url = `${window.location.origin}${pathname}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 1800);
  }

  return (
    <>
      <div className="lg:sticky lg:top-24 space-y-4">
        {/* Booking card */}
        <div className="relative rounded-3xl bg-white ring-1 ring-slate-100 overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04),0_22px_48px_-20px_rgba(13,148,136,0.35)]">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-teal-500 via-sky-500 to-rose-500" />

          <div className="p-6">
            <div className="flex items-end justify-between mb-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">от</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold text-slate-900 tabular-nums tracking-tight">${pricePerPerson.toLocaleString()}</p>
                  {oldPrice && (
                    <p className="text-sm text-slate-400 line-through tabular-nums">${oldPrice.toLocaleString()}</p>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">за человека · все налоги</p>
              </div>
              {discount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold ring-1 ring-rose-100">
                  <Sparkles className="h-3 w-3" />−{discount}%
                </span>
              )}
            </div>

            <div className="mt-5 space-y-2.5">
              <label className="block">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Дата вылета</span>
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 ring-1 ring-slate-100 focus-within:ring-teal-300 transition-all">
                  <Calendar className="h-4 w-4 text-teal-600 shrink-0" />
                  <input
                    type="date"
                    value={departDate}
                    onChange={e => setDepartDate(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
                  />
                </div>
              </label>
              <PaxStepper label="Персон" value={guests} setValue={setGuests} min={1} max={20} />
            </div>

            <div className="mt-4 rounded-xl bg-gradient-to-br from-teal-50/60 to-sky-50/60 ring-1 ring-teal-100/60 px-3.5 py-3">
              <div className="flex items-baseline justify-between">
                <p className="text-xs text-slate-600">{guests} {guests === 1 ? "гость" : "гостей"}</p>
                <p className="text-xl font-bold text-slate-900 tabular-nums">${totalEstimate.toLocaleString()}</p>
              </div>
              {savings > 0 && (
                <div className="flex items-center gap-1 mt-1 text-emerald-700">
                  <Tag className="h-3 w-3" />
                  <p className="text-[11px] font-bold">Вы экономите ${savings.toLocaleString()}</p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 px-5 py-4 rounded-full text-base font-bold text-white transition-all hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, #f97316, #f43f5e)", boxShadow: "0 18px 36px -12px rgba(244,63,94,0.55)" }}
            >
              Забронировать
              <ArrowRight className="h-[18px] w-[18px]" />
            </button>
            <button
              type="button"
              onClick={() => setWishlisted(w => !w)}
              className="mt-2 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-semibold bg-slate-50 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100 transition"
            >
              <Heart className={cn("h-4 w-4", wishlisted && "fill-rose-500 text-rose-500")} />
              {wishlisted ? "В избранном" : "Добавить в избранное"}
            </button>

            <p className="mt-3 text-center text-[11px] text-slate-500">
              Бесплатная отмена до подтверждения · Менеджер ответит за 20 минут
            </p>
          </div>

          <div className="border-t border-slate-100 divide-y divide-slate-100">
            <TrustRow icon={Shield} tone="emerald" label="Защищённое бронирование" />
            <TrustRow icon={Award} tone="amber" label="Гарантия лучшей цены" />
            <TrustRow icon={Headphones} tone="sky" label="Поддержка 24/7 в WhatsApp" />
          </div>
        </div>

        {/* Referral share widget */}
        <div
          className="relative overflow-hidden rounded-3xl text-white p-5"
          style={{
            background: "linear-gradient(135deg, #0d9488 0%, #0284c7 60%, #1e3a8a 100%)",
            boxShadow: "0 22px 48px -20px rgba(13,148,136,0.45)",
          }}
        >
          <div aria-hidden className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/15 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <div className="grid place-items-center h-9 w-9 rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
                <Share2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">Поделись и заработай</p>
                <p className="text-sm font-bold">Реферальная программа</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-white/90 leading-relaxed">
              Пригласи друга — получи <span className="font-bold">${referralReward}</span> на счёт после его поездки.
            </p>
            <div className="mt-4 flex items-center gap-1.5 rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur p-1">
              <code className="flex-1 px-3 py-1.5 text-[11px] font-mono text-white/90 truncate">
                {pathname}
              </code>
              <button
                type="button"
                onClick={copyReferral}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-teal-700 text-[11px] font-bold hover:bg-white/90 transition"
              >
                {shareCopied
                  ? <><Check className="h-3 w-3" strokeWidth={3} />Скопировано</>
                  : <><Copy className="h-3 w-3" />Скопировать</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>

      <BookingModal
        tourId={tourId}
        tourTitle={tourTitle}
        pricePerPerson={pricePerPerson}
        tourCoverImage={coverImage}
        tourCountry={country}
        tourHotelStars={hotelStars}
        tourDurationDays={durationDays}
        initialGuests={guests}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

function PaxStepper({
  label, value, setValue, min, max,
}: { label: string; value: number; setValue: (v: number) => void; min: number; max: number }) {
  return (
    <div className="rounded-xl bg-slate-50 ring-1 ring-slate-100 px-3.5 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <div className="flex items-center justify-between gap-2 mt-0.5">
        <span className="font-bold text-slate-900 tabular-nums">{value}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setValue(Math.max(min, value - 1))}
            className="grid place-items-center h-6 w-6 rounded-full bg-white ring-1 ring-slate-200 text-slate-600 hover:bg-slate-50 transition"
          >
            <Minus className="h-3 w-3" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => setValue(Math.min(max, value + 1))}
            className="grid place-items-center h-6 w-6 rounded-full bg-white ring-1 ring-slate-200 text-slate-600 hover:bg-slate-50 transition"
          >
            <Plus className="h-3 w-3" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

function TrustRow({ icon: Icon, tone, label }: { icon: React.ElementType; tone: "emerald" | "amber" | "sky"; label: string }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-600",
    sky: "bg-sky-50 text-sky-600",
  };
  return (
    <div className="px-6 py-3 flex items-center gap-3">
      <span className={cn("grid place-items-center h-8 w-8 rounded-lg shrink-0", tones[tone])}>
        <Icon className="h-[15px] w-[15px]" />
      </span>
      <p className="text-xs font-semibold text-slate-700">{label}</p>
    </div>
  );
}

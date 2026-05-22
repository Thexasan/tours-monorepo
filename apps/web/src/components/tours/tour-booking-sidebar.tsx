"use client";

import { useState, useEffect } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar, Users, Plus, Minus, ArrowRight,
  Shield, Award, Headphones, Sparkles, Tag, Share2, Copy, Check,
  Pencil, BookOpen,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { BookingModal } from "@/src/components/bookings/booking-modal";
import { WishlistButton } from "@/src/components/wishlist/wishlist-button";
import { useAuthStore } from "@/src/shared/store/auth-store";
import { cn } from "@/src/lib/utils";
import type { RoomTypeOption } from "@tours/types";

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
  roomTypes?: RoomTypeOption[];
  referralReward?: number;
}

export function TourBookingSidebar({
  tourId, tourTitle, tourSlug, pricePerPerson, oldPrice,
  coverImage, country, hotelStars, durationDays, roomTypes, referralReward = 50,
}: Props) {
  const t = useTranslations("tours");
  const locale = useLocale();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (searchParams?.get("book") === "1") {
      setOpen(true);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("book");
      const newUrl = params.size > 0 ? `${pathname}?${params.toString()}` : pathname;
      router.replace(newUrl, { scroll: false });
    }
  }, [searchParams, router, pathname]);

  const [guests, setGuests] = useState(() => {
    const g = searchParams?.get("guests");
    return g ? Math.max(1, Math.min(20, parseInt(g, 10) || 1)) : 1;
  });
  const [departDate, setDepartDate] = useState(() => searchParams?.get("date") ?? "");
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

  if (isAdmin) {
    return (
      <div className="lg:sticky lg:top-24">
        <div className="relative rounded-3xl bg-white ring-1 ring-slate-100 overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04),0_22px_48px_-20px_rgba(124,58,237,0.20)]">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-violet-500 via-indigo-500 to-violet-600" />
          <div className="p-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-4">Управление туром</p>
            <div className="flex items-baseline gap-2 mb-5">
              <p className="text-3xl font-bold text-slate-900 tabular-nums">${pricePerPerson.toLocaleString()}</p>
              <p className="text-sm text-slate-400">/ чел · {durationDays} дн.</p>
            </div>
            <div className="space-y-2.5">
              <Link
                href={`/${locale}/admin/tours/${tourId}/edit`}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 14px 28px -10px rgba(124,58,237,0.40)" }}
              >
                <Pencil className="h-4 w-4" />
                Редактировать тур
              </Link>
              <Link
                href={`/${locale}/admin/bookings`}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-bold text-slate-700 bg-slate-50 ring-1 ring-slate-200 hover:bg-slate-100 transition-all"
              >
                <BookOpen className="h-4 w-4 text-slate-400" />
                Заявки по туру
              </Link>
            </div>
          </div>
          <div className="border-t border-slate-100 divide-y divide-slate-100">
            <TrustRow icon={Shield} tone="emerald" label={t("sidebar.secureBooking")} />
            <TrustRow icon={Award} tone="amber" label={t("sidebar.bestPrice")} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="lg:sticky lg:top-24 space-y-4">
        {/* Booking card */}
        <div className="relative rounded-3xl bg-white ring-1 ring-slate-100 overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04),0_22px_48px_-20px_rgba(16,185,129,0.30)]">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-emerald-500 via-teal-500 to-emerald-600" />

          <div className="p-6">
            <div className="flex items-end justify-between mb-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t("sidebar.from")}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold text-slate-900 tabular-nums tracking-tight">${pricePerPerson.toLocaleString()}</p>
                  {oldPrice && (
                    <p className="text-sm text-slate-400 line-through tabular-nums">${oldPrice.toLocaleString()}</p>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{t("sidebar.perPerson")}</p>
              </div>
              {discount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold ring-1 ring-emerald-100">
                  <Sparkles className="h-3 w-3" />−{discount}%
                </span>
              )}
            </div>

            <div className="mt-5 space-y-2.5">
              <label className="block">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t("sidebar.departureDate")}</span>
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
              <PaxStepper label={t("sidebar.persons")} value={guests} setValue={setGuests} min={1} max={20} />
            </div>

            <div className="mt-4 rounded-xl bg-linear-to-br from-emerald-50/60 to-teal-50/60 ring-1 ring-emerald-100/60 px-3.5 py-3">
              <div className="flex items-baseline justify-between">
                <p className="text-xs text-slate-600">
                  {guests} {guests === 1 ? t("sidebar.guestOne") : t("sidebar.guestMany")}
                </p>
                <p className="text-xl font-bold text-slate-900 tabular-nums">${totalEstimate.toLocaleString()}</p>
              </div>
              {savings > 0 && (
                <div className="flex items-center gap-1 mt-1 text-emerald-700">
                  <Tag className="h-3 w-3" />
                  <p className="text-[11px] font-bold">{t("sidebar.youSave")} ${savings.toLocaleString()}</p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 px-5 py-4 rounded-full text-base font-bold text-white transition-all hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, #03956a, #027455)", boxShadow: "0 18px 36px -12px rgba(2,116,85,0.50)" }}
            >
              {t("sidebar.book")}
              <ArrowRight className="h-[18px] w-[18px]" />
            </button>
            <WishlistButton
              tourId={tourId}
              variant="sidebar"
              label={t("sidebar.addWishlist")}
              labelActive={t("sidebar.removeWishlist")}
            />

            <p className="mt-3 text-center text-[11px] text-slate-500">
              {t("sidebar.freeCancellation")}
            </p>
          </div>

          <div className="border-t border-slate-100 divide-y divide-slate-100">
            <TrustRow icon={Shield} tone="emerald" label={t("sidebar.secureBooking")} />
            <TrustRow icon={Award} tone="amber" label={t("sidebar.bestPrice")} />
            <TrustRow icon={Headphones} tone="sky" label={t("sidebar.support")} />
          </div>
        </div>

        {/* Referral share widget */}
        <div
          className="relative overflow-hidden rounded-3xl text-white p-5"
          style={{
            background: "linear-gradient(135deg, #03956a 0%, #027455 60%, #015e44 100%)",
            boxShadow: "0 22px 48px -20px rgba(2,116,85,0.40)",
          }}
        >
          <div aria-hidden className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/15 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <div className="grid place-items-center h-9 w-9 rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
                <Share2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">{t("sidebar.referral.badge")}</p>
                <p className="text-sm font-bold">{t("sidebar.referral.title")}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-white/90 leading-relaxed">
              {t("sidebar.referral.descPart1")} <span className="font-bold">${referralReward}</span> {t("sidebar.referral.descPart2")}
            </p>
            <div className="mt-4 flex items-center gap-1.5 rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur p-1">
              <code className="flex-1 px-3 py-1.5 text-[11px] font-mono text-white/90 truncate">
                {pathname}
              </code>
              <button
                type="button"
                onClick={copyReferral}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-emerald-700 text-[11px] font-bold hover:bg-white/90 transition"
              >
                {shareCopied
                  ? <><Check className="h-3 w-3" strokeWidth={3} />{t("sidebar.referral.copied")}</>
                  : <><Copy className="h-3 w-3" />{t("sidebar.referral.copy")}</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>

      <BookingModal
        tourId={tourId}
        tourTitle={tourTitle}
        tourSlug={tourSlug}
        pricePerPerson={pricePerPerson}
        tourCoverImage={coverImage}
        tourCountry={country}
        tourHotelStars={hotelStars}
        tourDurationDays={durationDays}
        tourRoomTypes={roomTypes}
        initialGuests={guests}
        initialDate={departDate || undefined}
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

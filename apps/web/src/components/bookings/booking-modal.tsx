"use client";

import { useState, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  Check, X, ChevronLeft, ChevronRight, Plus, Minus,
  User, Mail, Phone, BookMarked, Calendar, Users, Hotel,
  Shield, Sparkles, ArrowRight, UserPlus, LogIn, Lock,
} from "lucide-react";
import { bookingsApi } from "@/src/shared/api/bookings-api";
import { extractErrorMessage } from "@/src/shared/api/apiClient";
import { toast } from "sonner";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { cn } from "@/src/lib/utils";
import type { RoomTypeOption } from "@tours/types";

const schema = z.object({
  contactName: z.string().min(2).max(100),
  contactEmail: z.string().email(),
  contactPhone: z.string().regex(/^\+?[0-9\s\-()]{6,20}$/),
  guestsCount: z.coerce.number().int().min(1).max(20),
  preferredDate: z.string().optional(),
  notes: z.string().max(2000).optional(),
});
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export const BOOKING_INTENT_KEY = "pendingBookingIntent";

export interface BookingIntent {
  tourId: string;
  tourSlug: string;
  locale: string;
  date: CalDate;
  guests: number;
  roomId: string;
}

interface BookingModalProps {
  tourId: string;
  tourTitle: string;
  tourSlug?: string;
  pricePerPerson: number;
  tourCoverImage?: string;
  tourCountry?: string;
  tourHotelStars?: number;
  tourDurationDays?: number;
  tourRoomTypes?: RoomTypeOption[];
  initialGuests?: number;
  initialDate?: string;
  open: boolean;
  onClose: () => void;
}

type CalDate = { y: number; m: number; day: number } | null;

function parseIsoDate(iso: string): CalDate {
  const parts = iso.split("-").map(Number);
  const y = parts[0], m = parts[1], d = parts[2];
  if (!y || !m || !d) return null;
  return { y, m: m - 1, day: d };
}

function toIso(d: CalDate): string | undefined {
  if (!d) return undefined;
  const mm = String(d.m + 1).padStart(2, "0");
  const dd = String(d.day).padStart(2, "0");
  return `${d.y}-${mm}-${dd}`;
}

function plusDays(d: CalDate, n: number): CalDate {
  if (!d) return null;
  const dd = new Date(d.y, d.m, d.day + n);
  return { y: dd.getFullYear(), m: dd.getMonth(), day: dd.getDate() };
}

/* ─── Stepper ─────────────────────────────────────────────────────── */
function Stepper({ labels, activeIndex }: { labels: string[]; activeIndex: number }) {
  return (
    <div className="px-6 sm:px-10 pt-6 pb-2">
      <div className="flex items-start gap-2 sm:gap-4">
        {labels.map((label, i) => (
          <div key={label} className="flex flex-1 items-start gap-2 sm:gap-4 last:flex-none">
            <div className="flex flex-col items-center gap-2 min-w-0 shrink-0">
              <div
                className={cn(
                  "relative grid place-items-center h-10 w-10 rounded-full ring-4 transition-all duration-300",
                  activeIndex > i
                    ? "bg-orange-600 text-white ring-orange-100"
                    : activeIndex === i
                    ? "bg-white text-orange-700 ring-orange-200 shadow-[0_10px_24px_-10px_rgba(249,115,22,0.6)]"
                    : "bg-white text-slate-400 ring-slate-200",
                )}
              >
                {activeIndex > i
                  ? <Check className="h-[18px] w-[18px]" strokeWidth={2.5} />
                  : <span className="text-sm font-bold tabular-nums">{i + 1}</span>
                }
              </div>
              <span
                className={cn(
                  "text-[11px] font-semibold uppercase tracking-wider text-center whitespace-nowrap",
                  activeIndex >= i ? "text-slate-800" : "text-slate-400",
                )}
              >
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div className="flex-1 h-px mt-5 relative overflow-hidden rounded-full bg-slate-200">
                <div
                  className="absolute inset-y-0 left-0 bg-linear-to-r from-orange-500 to-sky-500 transition-all duration-500"
                  style={{ width: activeIndex > i ? "100%" : "0%" }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Counter ─────────────────────────────────────────────────────── */
function Counter({
  value, onChange, min = 0, max = 9, labelDecrease, labelIncrease,
}: {
  value: number; onChange: (v: number) => void;
  min?: number; max?: number;
  labelDecrease: string; labelIncrease: string;
}) {
  return (
    <div className="inline-flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="grid place-items-center h-9 w-9 rounded-full ring-1 ring-slate-200 text-slate-700 hover:bg-slate-50 hover:ring-orange-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        aria-label={labelDecrease}
      >
        <Minus className="h-4 w-4" strokeWidth={2.5} />
      </button>
      <span className="w-6 text-center font-bold tabular-nums text-slate-900">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="grid place-items-center h-9 w-9 rounded-full ring-1 ring-slate-200 text-slate-700 hover:bg-slate-50 hover:ring-orange-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        aria-label={labelIncrease}
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
      </button>
    </div>
  );
}

/* ─── Room card ───────────────────────────────────────────────────── */
function RoomCard({
  id, selected, onSelect, title, desc, priceMod, includedLabel,
}: {
  id: string; selected: boolean; onSelect: (id: string) => void;
  title: string; desc: string; priceMod: number; includedLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={cn(
        "relative text-left p-4 rounded-2xl ring-1 transition-all",
        selected
          ? "ring-orange-500 bg-orange-50/40 shadow-[0_10px_24px_-12px_rgba(249,115,22,0.4)]"
          : "ring-slate-200 bg-white hover:ring-slate-300",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 text-sm">{title}</p>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-slate-500">{priceMod === 0 ? includedLabel : `+$${priceMod}`}</p>
          <div
            className={cn(
              "mt-1 grid place-items-center h-5 w-5 rounded-full ring-2 transition-all ml-auto",
              selected ? "bg-orange-500 ring-orange-500" : "ring-slate-300",
            )}
          >
            {selected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
          </div>
        </div>
      </div>
    </button>
  );
}

/* ─── Mini calendar ───────────────────────────────────────────────── */
function MiniCalendar({
  value, onChange, monthNames, shortMonthNames, dayLabels, navBackLabel, navForwardLabel,
}: {
  value: CalDate;
  onChange: (d: CalDate) => void;
  monthNames: string[];
  shortMonthNames: string[];
  dayLabels: string[];
  navBackLabel: string;
  navForwardLabel: string;
}) {
  const [view, setView] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  function addMonths(v: { y: number; m: number }, n: number) {
    const d = new Date(v.y, v.m + n, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  }
  const months = [view, addMonths(view, 1)];
  const sel = value ? `${value.y}-${value.m}-${value.day}` : "";

  function isPast(d: { y: number; m: number; day: number }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(d.y, d.m, d.day) <= today;
  }

  return (
    <div className="rounded-2xl ring-1 ring-slate-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={() => setView(v => addMonths(v, -1))} className="h-8 w-8 grid place-items-center rounded-full text-slate-600 hover:bg-slate-100 transition" aria-label={navBackLabel}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold text-slate-900 tracking-tight">
          {monthNames[view.m]!} {view.y} <span className="text-slate-300 mx-1">→</span> {monthNames[months[1]!.m]!} {months[1]!.y}
        </p>
        <button type="button" onClick={() => setView(v => addMonths(v, 1))} className="h-8 w-8 grid place-items-center rounded-full text-slate-600 hover:bg-slate-100 transition" aria-label={navForwardLabel}>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {months.map((mv, mIdx) => {
          const firstDay = new Date(mv.y, mv.m, 1).getDay() || 7;
          const daysInMonth = new Date(mv.y, mv.m + 1, 0).getDate();
          const cells: Array<{ y: number; m: number; day: number } | null> = [];
          for (let i = 1; i < firstDay; i++) cells.push(null);
          for (let day = 1; day <= daysInMonth; day++) cells.push({ y: mv.y, m: mv.m, day });
          return (
            <div key={mIdx} className={mIdx === 1 ? "hidden sm:block" : ""}>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center mb-2">
                {monthNames[mv.m]} {mv.y}
              </p>
              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {dayLabels.map(d => (
                  <div key={d} className="text-[10px] font-bold uppercase text-slate-400 text-center py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {cells.map((c, i) => {
                  if (!c) return <div key={i} className="aspect-square" />;
                  const past = isPast(c);
                  const isSelected = `${c.y}-${c.m}-${c.day}` === sel;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => !past && onChange(c)}
                      disabled={past}
                      className={cn(
                        "aspect-square text-xs font-medium rounded-lg transition-all",
                        isSelected
                          ? "bg-orange-600 text-white shadow-[0_6px_14px_-6px_rgba(249,115,22,0.6)]"
                          : past
                          ? "text-slate-300 cursor-not-allowed"
                          : "text-slate-700 hover:bg-orange-50 hover:text-orange-700",
                      )}
                    >
                      {c.day}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── FormField ───────────────────────────────────────────────────── */
function FormField({
  label, icon: Icon, error, children,
}: {
  label: string; icon?: React.ElementType; error?: string; children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 mb-1.5">{label}</span>
      <div
        className={cn(
          "flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white ring-1 transition-all focus-within:ring-2",
          error ? "ring-rose-300 focus-within:ring-rose-500/40" : "ring-slate-200 focus-within:ring-orange-500/40",
        )}
      >
        {Icon && <Icon className="h-4 w-4 text-slate-400 shrink-0" />}
        {children}
      </div>
      {error && <span className="block mt-1 text-xs text-rose-600">{error}</span>}
    </label>
  );
}

/* ─── Main modal ──────────────────────────────────────────────────── */
export function BookingModal({
  tourId,
  tourTitle,
  tourSlug,
  pricePerPerson,
  tourCoverImage,
  tourCountry,
  tourHotelStars,
  tourDurationDays = 7,
  tourRoomTypes,
  initialGuests = 1,
  initialDate,
  open,
  onClose,
}: BookingModalProps) {
  const locale = useLocale();
  const t = useTranslations("tours");
  const { user, isAuthenticated } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successBookingId, setSuccessBookingId] = useState<string | null>(null);
  const [successEmail, setSuccessEmail] = useState("");

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [date, setDate] = useState<CalDate>(() => parseIsoDate(initialDate ?? ""));
  const [guests, setGuests] = useState(initialGuests);

  useEffect(() => {
    if (open) {
      setGuests(initialGuests);
      setShowAuthGate(false);
      setDate(parseIsoDate(initialDate ?? ""));
    }
  }, [open, initialGuests, initialDate]);

  const rooms: { id: string; title: string; desc: string; mod: number }[] =
    tourRoomTypes && tourRoomTypes.length > 0
      ? tourRoomTypes.map(r => ({ id: r.id, title: r.title, desc: r.desc ?? "", mod: r.priceModifier }))
      : [];

  const [room, setRoom] = useState(rooms[0]?.id ?? "");
  const [agreed, setAgreed] = useState(false);

  const selectedRoom = rooms.find(r => r.id === room) ?? rooms[0];

  const {
    register, handleSubmit, setValue, watch, formState: { errors }, reset,
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { guestsCount: 1, contactName: "", contactEmail: "", contactPhone: "", notes: "" },
  });

  useEffect(() => {
    if (user && open) {
      setValue("contactName", user.fullName, { shouldValidate: false });
      setValue("contactEmail", user.email, { shouldValidate: false });
    }
  }, [user, open, setValue]);

  useEffect(() => {
    if (!open || !isAuthenticated) return;
    try {
      const raw = sessionStorage.getItem(BOOKING_INTENT_KEY);
      if (!raw) return;
      const intent: BookingIntent = JSON.parse(raw);
      if (intent.tourId === tourId) {
        if (intent.date) setDate(intent.date);
        if (intent.guests) setGuests(intent.guests);
        if (intent.roomId) setRoom(intent.roomId);
        sessionStorage.removeItem(BOOKING_INTENT_KEY);
      }
    } catch {}
  }, [open, isAuthenticated, tourId]);

  const onSubmit: SubmitHandler<FormOutput> = async (values) => {
    setSubmitting(true);
    setError(null);
    try {
      const booking = await bookingsApi.create({
        tourId,
        contactName: values.contactName,
        contactEmail: values.contactEmail,
        contactPhone: values.contactPhone,
        guestsCount: values.guestsCount,
        preferredDate: values.preferredDate || undefined,
        roomType: selectedRoom?.title || undefined,
        notes: values.notes || undefined,
      });
      setSuccessBookingId(booking.id);
      setSuccessEmail(values.contactEmail);
      setSuccess(true);
      reset();
    } catch (e) {
      const msg = extractErrorMessage(e);
      setError(msg);
      toast.error(t("booking.error"), { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const base = pricePerPerson * guests;
  const roomTotal = (selectedRoom?.mod ?? 0) * guests;
  const subtotal = base + roomTotal;
  const taxes = Math.round(subtotal * 0.08);
  const total = subtotal + taxes;

  const canStep0 = !!date && guests >= 1;
  const watchedName = watch("contactName") ?? "";
  const watchedEmail = watch("contactEmail") ?? "";
  const watchedPhone = watch("contactPhone") ?? "";
  const canStep1 = watchedName.length >= 2 && watchedEmail.includes("@") && watchedPhone.length >= 6
    && !errors.contactName && !errors.contactEmail && !errors.contactPhone;

  const stepperLabels = isAuthenticated
    ? [t("booking.stepper.options"), t("booking.stepper.confirm")]
    : [t("booking.stepper.options"), t("booking.stepper.travelers"), t("booking.stepper.confirm")];
  const stepperActiveIndex = isAuthenticated ? (step === 0 ? 0 : 1) : step;

  // Build calendar arrays from translations
  const monthNames = [
    t("booking.calendar.jan"), t("booking.calendar.feb"), t("booking.calendar.mar"),
    t("booking.calendar.apr"), t("booking.calendar.may"), t("booking.calendar.jun"),
    t("booking.calendar.jul"), t("booking.calendar.aug"), t("booking.calendar.sep"),
    t("booking.calendar.oct"), t("booking.calendar.nov"), t("booking.calendar.dec"),
  ];
  const shortMonthNames = [
    t("booking.calendar.janShort"), t("booking.calendar.febShort"), t("booking.calendar.marShort"),
    t("booking.calendar.aprShort"), t("booking.calendar.mayShort"), t("booking.calendar.junShort"),
    t("booking.calendar.julShort"), t("booking.calendar.augShort"), t("booking.calendar.sepShort"),
    t("booking.calendar.octShort"), t("booking.calendar.novShort"), t("booking.calendar.decShort"),
  ];
  const dayLabels = [
    t("booking.calendar.mon"), t("booking.calendar.tue"), t("booking.calendar.wed"),
    t("booking.calendar.thu"), t("booking.calendar.fri"), t("booking.calendar.sat"),
    t("booking.calendar.sun"),
  ];

  function fmtDate(d: CalDate): string {
    if (!d) return "—";
    return `${d.day} ${shortMonthNames[d.m]} ${d.y}`;
  }

  function handleClose() {
    setSuccess(false);
    setError(null);
    setStep(0);
    setShowAuthGate(false);
    setSuccessBookingId(null);
    setSuccessEmail("");
    onClose();
  }

  function nextStep() {
    if (step === 0) {
      setValue("guestsCount", guests, { shouldValidate: true });
      setValue("preferredDate", toIso(date) ?? "", { shouldValidate: false });
      if (isAuthenticated) {
        setStep(2);
      } else {
        if (tourSlug) {
          try {
            const intent: BookingIntent = { tourId, tourSlug, locale, date, guests, roomId: room };
            sessionStorage.setItem(BOOKING_INTENT_KEY, JSON.stringify(intent));
          } catch {}
        }
        setShowAuthGate(true);
      }
    } else if (step === 1) {
      setStep(2);
    }
  }

  function handleBack() {
    setStep(isAuthenticated && step === 2 ? 0 : (step - 1) as 0 | 1 | 2);
  }

  if (!open) return null;

  const showStepper = !success && !showAuthGate;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-950/60 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-[0_40px_80px_-20px_rgba(15,23,42,0.5)] w-full max-w-3xl max-h-[94vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 grid place-items-center h-9 w-9 rounded-full bg-white/90 backdrop-blur ring-1 ring-slate-200 text-slate-500 hover:text-slate-900 hover:bg-white transition"
          aria-label={t("booking.close")}
        >
          <X className="h-[18px] w-[18px]" />
        </button>

        {showStepper && <Stepper labels={stepperLabels} activeIndex={stepperActiveIndex} />}

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 sm:px-10 pb-6 flex flex-col">

          {/* ── SUCCESS ──────────────────────────────────────────── */}
          {success ? (
            <div className="py-12 text-center max-w-md mx-auto">
              <div className="relative inline-grid place-items-center mb-5">
                <div className="absolute inset-0 rounded-full bg-emerald-100 blur-2xl opacity-60" />
                <div className="relative h-20 w-20 rounded-full bg-linear-to-br from-emerald-400 to-orange-600 grid place-items-center text-white shadow-[0_20px_40px_-12px_rgba(249,115,22,0.6)]">
                  <Check className="h-9 w-9" strokeWidth={2.5} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{t("booking.success.title")}</h3>
              <p className="mt-2 text-slate-600 leading-relaxed">{t("booking.success.desc")}</p>
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold ring-1 ring-amber-100">
                <Sparkles className="h-3.5 w-3.5" />
                {t("booking.success.referralNote")}
              </div>
              <div className="mt-7 space-y-3">
                {isAuthenticated ? (
                  <Link
                    href={`/${locale}/dashboard/trips`}
                    onClick={handleClose}
                    className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-2xl text-sm font-bold text-white transition-all hover:-translate-y-0.5"
                    style={{ background: "linear-gradient(135deg, #f97316, #0284c7)" }}
                  >
                    {t("booking.success.myBookings")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <>
                    <Link
                      href={`/${locale}/register?email=${encodeURIComponent(successEmail)}&bookingId=${successBookingId ?? ""}`}
                      onClick={handleClose}
                      className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-2xl text-sm font-bold text-white transition-all hover:-translate-y-0.5"
                      style={{ background: "linear-gradient(135deg, #f97316, #0284c7)" }}
                    >
                      <UserPlus className="h-4 w-4" />
                      {t("booking.success.register")}
                    </Link>
                    <Link
                      href={`/${locale}/login?next=${encodeURIComponent(`/${locale}/dashboard/trips`)}`}
                      onClick={handleClose}
                      className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-2xl text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 transition"
                    >
                      <LogIn className="h-4 w-4" />
                      {t("booking.success.hasAccount")}
                    </Link>
                  </>
                )}
                <button
                  type="button"
                  onClick={handleClose}
                  className="block w-full text-xs text-slate-400 hover:text-slate-600 transition-colors py-1"
                >
                  {t("booking.success.close")}
                </button>
              </div>
            </div>

          /* ── AUTH GATE ───────────────────────────────────────── */
          ) : showAuthGate ? (
            <div className="py-10 flex flex-col items-center gap-6 max-w-sm mx-auto text-center mt-3">
              <div className="grid place-items-center h-16 w-16 rounded-2xl bg-orange-50 ring-1 ring-orange-100 text-orange-600">
                <Lock className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">{t("booking.authGate.title")}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{t("booking.authGate.desc")}</p>
              </div>
              <div className="w-full space-y-3">
                <Link
                  href={`/${locale}/register`}
                  className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-2xl text-sm font-bold text-white hover:-translate-y-0.5 transition-all"
                  style={{ background: "linear-gradient(135deg, #f97316, #0284c7)" }}
                >
                  <UserPlus className="h-4 w-4" />
                  {t("booking.authGate.register")}
                </Link>
                <Link
                  href={`/${locale}/login`}
                  className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-2xl text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 transition"
                >
                  <LogIn className="h-4 w-4" />
                  {t("booking.authGate.hasAccount")}
                </Link>
                <button
                  type="button"
                  onClick={() => setShowAuthGate(false)}
                  className="block w-full text-xs text-slate-400 hover:text-slate-600 transition-colors py-1"
                >
                  {t("booking.authGate.back")}
                </button>
              </div>
            </div>

          /* ── STEP 0: OPTIONS ─────────────────────────────────── */
          ) : step === 0 ? (
            <div className="space-y-5 mt-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">{t("booking.step0.title")}</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  {t("booking.step0.durationPrefix")} {tourDurationDays} {t("booking.step0.durationDays")} / {Math.max(1, tourDurationDays - 1)} {t("booking.step0.durationNights")}
                </p>
              </div>

              <MiniCalendar
                value={date}
                onChange={setDate}
                monthNames={monthNames}
                shortMonthNames={shortMonthNames}
                dayLabels={dayLabels}
                navBackLabel={t("booking.calendar.navBack")}
                navForwardLabel={t("booking.calendar.navForward")}
              />

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 mb-3">{t("booking.step0.travelers")}</p>
                <div className="rounded-2xl ring-1 ring-slate-200 bg-white">
                  <div className="flex items-center justify-between px-4 py-3.5">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{t("booking.step0.persons")}</p>
                      <p className="text-xs text-slate-500">${pricePerPerson} {t("booking.step0.perPersonPrefix")}</p>
                    </div>
                    <Counter
                      value={guests}
                      onChange={setGuests}
                      min={1}
                      max={20}
                      labelDecrease={t("booking.decrease")}
                      labelIncrease={t("booking.increase")}
                    />
                  </div>
                </div>
              </div>

              {rooms.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 mb-3">{t("booking.step0.roomType")}</p>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {rooms.map(r => (
                      <RoomCard
                        key={r.id}
                        {...r}
                        selected={room === r.id}
                        onSelect={setRoom}
                        priceMod={r.mod}
                        includedLabel={t("booking.step0.included")}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

          /* ── STEP 1: TRAVELER DETAILS ─────────────────────────── */
          ) : step === 1 ? (
            <div className="space-y-4 mt-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">{t("booking.step1.title")}</h3>
                <p className="text-sm text-slate-500 mt-0.5">{t("booking.step1.subtitle")}</p>
              </div>
              <FormField label={t("booking.step1.nameField")} icon={User} error={errors.contactName?.message}>
                <input
                  {...register("contactName")}
                  placeholder="ALINA KOVAL"
                  className="w-full bg-transparent text-[15px] font-medium text-slate-900 placeholder:text-slate-300 outline-none"
                />
              </FormField>
              <FormField label={t("booking.step1.passport")} icon={BookMarked}>
                <input
                  {...register("notes")}
                  placeholder="N1234567"
                  className="w-full bg-transparent text-[15px] font-medium text-slate-900 placeholder:text-slate-300 outline-none uppercase tracking-wider"
                />
              </FormField>
              <div className="grid sm:grid-cols-2 gap-3">
                <FormField label={t("booking.step1.phone")} icon={Phone} error={errors.contactPhone?.message}>
                  <input
                    {...register("contactPhone")}
                    type="tel"
                    placeholder="+7 705 123 4567"
                    className="w-full bg-transparent text-[15px] font-medium text-slate-900 placeholder:text-slate-300 outline-none"
                  />
                </FormField>
                <FormField label={t("booking.step1.email")} icon={Mail} error={errors.contactEmail?.message}>
                  <input
                    {...register("contactEmail")}
                    type="email"
                    placeholder="alina@example.com"
                    className="w-full bg-transparent text-[15px] font-medium text-slate-900 placeholder:text-slate-300 outline-none"
                  />
                </FormField>
              </div>

              <div className="rounded-2xl bg-linear-to-br from-orange-50 to-sky-50 ring-1 ring-orange-100 p-4 flex gap-3">
                <div className="grid place-items-center h-9 w-9 rounded-xl bg-white text-orange-700 ring-1 ring-orange-100 shrink-0">
                  <Shield className="h-[18px] w-[18px]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{t("booking.step1.protected")}</p>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{t("booking.step1.protectedDesc")}</p>
                </div>
              </div>

              {guests > 1 && (
                <div className="rounded-2xl bg-amber-50/60 ring-1 ring-amber-100 p-4 flex gap-3">
                  <div className="grid place-items-center h-9 w-9 rounded-xl bg-white text-amber-600 ring-1 ring-amber-100 shrink-0">
                    <Users className="h-[18px] w-[18px]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t("booking.step1.otherTravelers")}</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {t("booking.step1.otherTravelersDesc1")} {guests - 1} {t("booking.step1.otherTravelersDesc2")}
                    </p>
                  </div>
                </div>
              )}

              <input type="hidden" {...register("guestsCount", { valueAsNumber: true })} />
              <input type="hidden" {...register("preferredDate")} />
            </div>

          /* ── STEP 2: CONFIRMATION ─────────────────────────────── */
          ) : (
            <div className="space-y-4 mt-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">{t("booking.step2.title")}</h3>
                <p className="text-sm text-slate-500 mt-0.5">{t("booking.step2.subtitle")}</p>
              </div>

              {isAuthenticated && (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-orange-50/50 ring-1 ring-orange-100 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-orange-600 mb-3">{t("booking.step2.profileData")}</p>
                    <div className="grid sm:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-700">
                        <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium truncate">{user?.fullName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700">
                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{user?.email}</span>
                      </div>
                    </div>
                  </div>
                  <FormField label={t("booking.step2.contactPhone")} icon={Phone} error={errors.contactPhone?.message}>
                    <input
                      {...register("contactPhone")}
                      type="tel"
                      placeholder="+7 705 123 4567"
                      autoFocus
                      className="w-full bg-transparent text-[15px] font-medium text-slate-900 placeholder:text-slate-300 outline-none"
                    />
                  </FormField>
                  <input type="hidden" {...register("guestsCount", { valueAsNumber: true })} />
                  <input type="hidden" {...register("preferredDate")} />
                </div>
              )}

              {/* Tour preview */}
              <div className="rounded-2xl ring-1 ring-slate-200 overflow-hidden">
                <div className="flex gap-4 p-4 bg-linear-to-br from-slate-50 to-white">
                  <div className="relative w-24 h-24 rounded-xl ring-1 ring-slate-200 shrink-0 overflow-hidden bg-slate-100">
                    {tourCoverImage && (
                      <Image src={tourCoverImage} alt={tourTitle} fill className="object-cover" sizes="96px" />
                    )}
                  </div>
                  <div className="min-w-0">
                    {tourCountry && <p className="text-xs text-rose-600 font-bold uppercase tracking-wider">{tourCountry}</p>}
                    <p className="font-bold text-slate-900 text-base mt-0.5 leading-tight line-clamp-2">{tourTitle}</p>
                    {tourHotelStars && <p className="text-xs text-slate-500 mt-1">{tourHotelStars}★</p>}
                  </div>
                </div>
                <div className="divide-y divide-slate-100 text-sm">
                  {[
                    {
                      k: t("booking.step2.checkIn"),
                      v: `${fmtDate(date)} → ${fmtDate(plusDays(date, tourDurationDays))}`,
                      Ic: Calendar,
                    },
                    {
                      k: t("booking.step2.guests"),
                      v: `${guests} ${guests === 1 ? t("booking.step2.personOne") : t("booking.step2.personsMany")}`,
                      Ic: Users,
                    },
                    ...(selectedRoom ? [{ k: t("booking.step2.room"), v: selectedRoom.title, Ic: Hotel }] : []),
                    ...(!isAuthenticated ? [{ k: t("booking.step2.guestName"), v: watchedName || "—", Ic: User }] : []),
                  ].map(({ k, v, Ic }) => (
                    <div key={k} className="flex items-center justify-between px-4 py-3">
                      <span className="flex items-center gap-2 text-slate-500">
                        <Ic className="h-3.5 w-3.5" />
                        {k}
                      </span>
                      <span className="font-semibold text-slate-900 text-right truncate ml-3">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price breakdown */}
              <div className="rounded-2xl ring-1 ring-slate-200 p-4 text-sm space-y-2">
                <div className="flex items-center justify-between text-slate-600">
                  <span>{t("booking.step2.subtotalPrefix")} {guests}</span>
                  <span className="tabular-nums">${(pricePerPerson * guests).toLocaleString()}</span>
                </div>
                {roomTotal > 0 && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span>{t("booking.step2.roomUpgrade")}</span>
                    <span className="tabular-nums">${roomTotal.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-slate-600">
                  <span>{t("booking.step2.taxes")}</span>
                  <span className="tabular-nums">${taxes.toLocaleString()}</span>
                </div>
                <div className="h-px bg-slate-100 my-1" />
                <div className="flex items-end justify-between pt-1">
                  <div>
                    <p className="text-xs text-slate-500">{t("booking.step2.total")}</p>
                    <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">{t("booking.step2.totalNote")}</p>
                  </div>
                  <p className="text-3xl font-bold text-slate-900 tabular-nums tracking-tight">${total.toLocaleString()}</p>
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <label className="flex items-start gap-3 px-1 py-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={cn(
                    "mt-0.5 grid place-items-center h-5 w-5 rounded-md ring-1 transition-all shrink-0",
                    agreed ? "bg-orange-600 ring-orange-600" : "bg-white ring-slate-300",
                  )}
                >
                  {agreed && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </div>
                <span className="text-xs text-slate-600 leading-relaxed">
                  {t("booking.step2.agree")}{" "}
                  <a href="#" className="text-orange-700 font-semibold underline-offset-2 hover:underline">{t("booking.step2.terms")}</a>
                  {" "}{t("booking.step2.and")}{" "}
                  <a href="#" className="text-orange-700 font-semibold underline-offset-2 hover:underline">{t("booking.step2.privacy")}</a>.
                  {" "}{t("booking.step2.agreeNote")}
                </span>
              </label>
            </div>
          )}

          {/* ── BOTTOM BAR ──────────────────────────────────────── */}
          {!success && !showAuthGate && (
            <div className="mt-6 -mx-6 sm:-mx-10 px-6 sm:px-10 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">{t("booking.bottom.amount")}</p>
                <p className="text-lg font-bold text-slate-900 tabular-nums leading-tight">${total.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white text-slate-700 text-sm font-semibold ring-1 ring-slate-200 hover:bg-slate-50 transition"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t("booking.bottom.back")}
                  </button>
                )}
                {step < 2 ? (
                  <button
                    type="button"
                    disabled={step === 0 ? !canStep0 : !canStep1}
                    onClick={nextStep}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0"
                    style={{ background: "linear-gradient(135deg, #f97316, #f43f5e)" }}
                  >
                    {t("booking.bottom.continue")}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!agreed || submitting || (isAuthenticated && watchedPhone.length < 6)}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0"
                    style={{ background: "linear-gradient(135deg, #f97316, #0284c7)" }}
                  >
                    {submitting ? t("booking.bottom.submitting") : t("booking.bottom.submit")}
                    {!submitting && <Check className="h-4 w-4" strokeWidth={2.5} />}
                  </button>
                )}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

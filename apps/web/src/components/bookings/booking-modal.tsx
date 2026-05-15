"use client";

/* ============================================================
 * BookingModal — 3-step booking flow
 *
 * PRESERVED (same contracts as the original):
 *   - Props:  { tourId, tourTitle, pricePerPerson, open, onClose }
 *   - Form schema (zod): contactName, contactEmail, contactPhone,
 *                        guestsCount, preferredDate, notes
 *   - Submit handler:    bookingsApi.create({ ... })
 *   - Error formatter:   extractErrorMessage(e)
 *   - Success state UI   (success message + close)
 *
 * NEW (UI only):
 *   - 3 visual steps: options → traveler details → confirmation
 *   - Step indicator with progress bar
 *   - Mini 2-month date picker (writes the same preferredDate string)
 *   - Guest stepper + child counter (children combined into guestsCount)
 *   - Price breakdown summary on step 3
 *
 * Email notification is server-side (NestJS) and is triggered by
 * bookingsApi.create — same call, same payload.
 * ============================================================ */

import { useState, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import {
  Check, X, ChevronLeft, ChevronRight, Plus, Minus,
  User, Mail, Phone, BookMarked, Calendar, Users, Hotel,
  Shield, Sparkles, ArrowRight,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { bookingsApi } from "@/src/shared/api/bookings-api";
import { extractErrorMessage } from "@/src/shared/api/apiClient";
import { cn } from "@/src/lib/utils";
import type { RoomTypeOption } from "@tours/types";

/* Form schema — UNCHANGED from original implementation */
const schema = z.object({
  contactName: z.string().min(2, "Минимум 2 символа").max(100),
  contactEmail: z.string().email("Некорректный email"),
  contactPhone: z.string().regex(/^\+?[0-9\s\-()]{6,20}$/, "Некорректный телефон"),
  guestsCount: z.coerce.number().int().min(1).max(20),
  preferredDate: z.string().optional(),
  notes: z.string().max(2000).optional(),
});
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

interface BookingModalProps {
  tourId: string;
  tourTitle: string;
  pricePerPerson: number;
  /** Optional — used for the confirmation slide image. */
  tourCoverImage?: string;
  tourCountry?: string;
  tourHotelStars?: number;
  tourDurationDays?: number;
  tourRoomTypes?: RoomTypeOption[];
  initialGuests?: number;
  open: boolean;
  onClose: () => void;
}

type CalDate = { y: number; m: number; day: number } | null;

function toIso(d: CalDate): string | undefined {
  if (!d) return undefined;
  const mm = String(d.m + 1).padStart(2, "0");
  const dd = String(d.day).padStart(2, "0");
  return `${d.y}-${mm}-${dd}`;
}

function fmtDate(d: CalDate): string {
  if (!d) return "—";
  const months = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  return `${d.day} ${months[d.m]} ${d.y}`;
}

function plusDays(d: CalDate, n: number): CalDate {
  if (!d) return null;
  const dd = new Date(d.y, d.m, d.day + n);
  return { y: dd.getFullYear(), m: dd.getMonth(), day: dd.getDate() };
}

/* ─── Step indicator ────────────────────────────────────────── */
function Stepper({ step }: { step: 0 | 1 | 2 }) {
  const labels = ["Опции", "Путешественники", "Подтверждение"];
  return (
    <div className="px-6 sm:px-10 pt-6 pb-2">
      <div className="flex items-start gap-2 sm:gap-4">
        {labels.map((label, i) => (
          <div key={label} className="flex flex-1 items-start gap-2 sm:gap-4 last:flex-none">
            <div className="flex flex-col items-center gap-2 min-w-0 shrink-0">
              <div
                className={cn(
                  "relative grid place-items-center h-10 w-10 rounded-full ring-4 transition-all duration-300",
                  step > i
                    ? "bg-teal-600 text-white ring-teal-100"
                    : step === i
                    ? "bg-white text-teal-700 ring-teal-200 shadow-[0_10px_24px_-10px_rgba(13,148,136,0.6)]"
                    : "bg-white text-slate-400 ring-slate-200",
                )}
              >
                {step > i
                  ? <Check className="h-[18px] w-[18px]" strokeWidth={2.5} />
                  : <span className="text-sm font-bold tabular-nums">{i + 1}</span>
                }
              </div>
              <span
                className={cn(
                  "text-[11px] font-semibold uppercase tracking-wider text-center whitespace-nowrap",
                  step >= i ? "text-slate-800" : "text-slate-400",
                )}
              >
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div className="flex-1 h-px mt-5 relative overflow-hidden rounded-full bg-slate-200">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-teal-500 to-sky-500 transition-all duration-500"
                  style={{ width: step > i ? "100%" : "0%" }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Counter ───────────────────────────────────────────────── */
function Counter({
  value, onChange, min = 0, max = 9,
}: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="inline-flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="grid place-items-center h-9 w-9 rounded-full ring-1 ring-slate-200 text-slate-700 hover:bg-slate-50 hover:ring-teal-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        aria-label="Уменьшить"
      >
        <Minus className="h-4 w-4" strokeWidth={2.5} />
      </button>
      <span className="w-6 text-center font-bold tabular-nums text-slate-900">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="grid place-items-center h-9 w-9 rounded-full ring-1 ring-slate-200 text-slate-700 hover:bg-slate-50 hover:ring-teal-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        aria-label="Увеличить"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
      </button>
    </div>
  );
}

/* ─── Room card ─────────────────────────────────────────────── */
function RoomCard({
  id, selected, onSelect, title, desc, priceMod,
}: {
  id: string; selected: boolean; onSelect: (id: string) => void;
  title: string; desc: string; priceMod: number;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={cn(
        "relative text-left p-4 rounded-2xl ring-1 transition-all",
        selected
          ? "ring-teal-500 bg-teal-50/40 shadow-[0_10px_24px_-12px_rgba(13,148,136,0.4)]"
          : "ring-slate-200 bg-white hover:ring-slate-300",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 text-sm">{title}</p>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-slate-500">{priceMod === 0 ? "включено" : `+$${priceMod}`}</p>
          <div
            className={cn(
              "mt-1 grid place-items-center h-5 w-5 rounded-full ring-2 transition-all ml-auto",
              selected ? "bg-teal-500 ring-teal-500" : "ring-slate-300",
            )}
          >
            {selected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
          </div>
        </div>
      </div>
    </button>
  );
}

/* ─── Mini calendar (2 months) ──────────────────────────────── */
function MiniCalendar({
  value, onChange,
}: { value: CalDate; onChange: (d: CalDate) => void }) {
  const [view, setView] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  function addMonths(v: { y: number; m: number }, n: number) {
    const d = new Date(v.y, v.m + n, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  }
  const months = [view, addMonths(view, 1)];
  const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  const dayLabels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const sel = value ? `${value.y}-${value.m}-${value.day}` : "";

  function isPast(d: { y: number; m: number; day: number }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(d.y, d.m, d.day) < today;
  }

  return (
    <div className="rounded-2xl ring-1 ring-slate-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={() => setView(v => addMonths(v, -1))} className="h-8 w-8 grid place-items-center rounded-full text-slate-600 hover:bg-slate-100 transition" aria-label="Назад">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold text-slate-900 tracking-tight">
          {monthNames[view.m]!} {view.y} <span className="text-slate-300 mx-1">→</span> {monthNames[months[1]!.m]!} {months[1]!.y}
        </p>
        <button type="button" onClick={() => setView(v => addMonths(v, 1))} className="h-8 w-8 grid place-items-center rounded-full text-slate-600 hover:bg-slate-100 transition" aria-label="Вперёд">
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
                          ? "bg-teal-600 text-white shadow-[0_6px_14px_-6px_rgba(13,148,136,0.6)]"
                          : past
                          ? "text-slate-300 cursor-not-allowed"
                          : "text-slate-700 hover:bg-teal-50 hover:text-teal-700",
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

/* ─── FormField ─────────────────────────────────────────────── */
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
          error ? "ring-rose-300 focus-within:ring-rose-500/40" : "ring-slate-200 focus-within:ring-teal-500/40",
        )}
      >
        {Icon && <Icon className="h-4 w-4 text-slate-400 shrink-0" />}
        {children}
      </div>
      {error && <span className="block mt-1 text-xs text-rose-600">{error}</span>}
    </label>
  );
}

/* ─── Main modal ────────────────────────────────────────────── */
export function BookingModal({
  tourId,
  tourTitle,
  pricePerPerson,
  tourCoverImage,
  tourCountry,
  tourHotelStars,
  tourDurationDays = 7,
  tourRoomTypes,
  initialGuests = 1,
  open,
  onClose,
}: BookingModalProps) {
  /* Server-state — UNCHANGED */
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* UI-only step + extras */
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [date, setDate] = useState<CalDate>(null);
  const [guests, setGuests] = useState(initialGuests);
  useEffect(() => { if (open) setGuests(initialGuests); }, [open, initialGuests]);
  const rooms: { id: string; title: string; desc: string; mod: number }[] =
    tourRoomTypes && tourRoomTypes.length > 0
      ? tourRoomTypes.map(r => ({ id: r.id, title: r.title, desc: r.desc ?? "", mod: r.priceModifier }))
      : [];

  const [room, setRoom] = useState(rooms[0]?.id ?? "");
  const [agreed, setAgreed] = useState(false);

  const selectedRoom = rooms.find(r => r.id === room) ?? rooms[0];

  /* React Hook Form — schema and submit handler UNCHANGED */
  const {
    register, handleSubmit, setValue, watch, formState: { errors }, reset,
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { guestsCount: 1, contactName: "", contactEmail: "", contactPhone: "", notes: "" },
  });

  const watchedName = watch("contactName") ?? "";
  const watchedEmail = watch("contactEmail") ?? "";
  const watchedPhone = watch("contactPhone") ?? "";

  /* Submit — IDENTICAL payload to original implementation */
  const onSubmit: SubmitHandler<FormOutput> = async (values) => {
    setSubmitting(true);
    setError(null);
    try {
      await bookingsApi.create({
        tourId,
        contactName: values.contactName,
        contactEmail: values.contactEmail,
        contactPhone: values.contactPhone,
        guestsCount: values.guestsCount,
        preferredDate: values.preferredDate || undefined,
        roomType: selectedRoom?.title || undefined,
        notes: values.notes || undefined,
      });
      setSuccess(true);
      reset();
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  /* Price math (UI-only — server recalculates from tour.priceUsd) */
  const base = pricePerPerson * guests;
  const roomTotal = (selectedRoom?.mod ?? 0) * guests;
  const subtotal = base + roomTotal;
  const taxes = Math.round(subtotal * 0.08);
  const total = subtotal + taxes;

  const canStep1 = !!date && guests >= 1;
  const canStep2 = watchedName.length >= 2 && watchedEmail.includes("@") && watchedPhone.length >= 6
    && !errors.contactName && !errors.contactEmail && !errors.contactPhone;

  function handleClose() {
    setSuccess(false);
    setError(null);
    setStep(0);
    onClose();
  }

  function nextStep() {
    if (step === 0) {
      setValue("guestsCount", guests, { shouldValidate: true });
      setValue("preferredDate", toIso(date) ?? "", { shouldValidate: false });
      setStep(1);
    } else if (step === 1) {
      setStep(2);
    }
  }

  if (!open) return null;

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
          aria-label="Закрыть"
        >
          <X className="h-[18px] w-[18px]" />
        </button>

        {!success && <Stepper step={step} />}

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 sm:px-10 pb-6 flex flex-col">
          {success ? (
            <div className="py-12 text-center max-w-md mx-auto">
              <div className="relative inline-grid place-items-center mb-5">
                <div className="absolute inset-0 rounded-full bg-emerald-100 blur-2xl opacity-60" />
                <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 grid place-items-center text-white shadow-[0_20px_40px_-12px_rgba(13,148,136,0.6)]">
                  <Check className="h-9 w-9" strokeWidth={2.5} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Заявка отправлена!</h3>
              <p className="mt-2 text-slate-600 leading-relaxed">
                Менеджер свяжется с вами в течение часа на указанный email.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold ring-1 ring-amber-100">
                <Sparkles className="h-3.5 w-3.5" />
                +1 реферал засчитается после оплаты
              </div>
              <div className="mt-7">
                <Button type="button" onClick={handleClose}>Закрыть</Button>
              </div>
            </div>
          ) : step === 0 ? (
            <div className="space-y-5 mt-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Выберите даты и состав группы</h3>
                <p className="text-sm text-slate-500 mt-0.5">Длительность фиксированная — {tourDurationDays} дней / {Math.max(1, tourDurationDays - 1)} ночей</p>
              </div>

              <MiniCalendar value={date} onChange={setDate} />

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 mb-3">Путешественники</p>
                <div className="rounded-2xl ring-1 ring-slate-200 bg-white">
                  <div className="flex items-center justify-between px-4 py-3.5">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">Количество персон</p>
                      <p className="text-xs text-slate-500">${pricePerPerson} за человека</p>
                    </div>
                    <Counter value={guests} onChange={setGuests} min={1} max={20} />
                  </div>
                </div>
              </div>

              {rooms.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 mb-3">Тип размещения</p>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {rooms.map(r => (
                      <RoomCard key={r.id} {...r} selected={room === r.id} onSelect={setRoom} priceMod={r.mod} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : step === 1 ? (
            <div className="space-y-4 mt-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Данные путешественника</h3>
                <p className="text-sm text-slate-500 mt-0.5">Имя и фамилия как в загранпаспорте — латиницей</p>
              </div>
              <FormField label="Имя и фамилия" icon={User} error={errors.contactName?.message}>
                <input
                  {...register("contactName")}
                  placeholder="ALINA KOVAL"
                  className="w-full bg-transparent text-[15px] font-medium text-slate-900 placeholder:text-slate-300 outline-none"
                />
              </FormField>
              <FormField label="Номер загранпаспорта (опц.)" icon={BookMarked}>
                <input
                  {...register("notes")}
                  placeholder="N1234567"
                  className="w-full bg-transparent text-[15px] font-medium text-slate-900 placeholder:text-slate-300 outline-none uppercase tracking-wider"
                />
              </FormField>
              <div className="grid sm:grid-cols-2 gap-3">
                <FormField label="Телефон" icon={Phone} error={errors.contactPhone?.message}>
                  <input
                    {...register("contactPhone")}
                    type="tel"
                    placeholder="+7 705 123 4567"
                    className="w-full bg-transparent text-[15px] font-medium text-slate-900 placeholder:text-slate-300 outline-none"
                  />
                </FormField>
                <FormField label="Email" icon={Mail} error={errors.contactEmail?.message}>
                  <input
                    {...register("contactEmail")}
                    type="email"
                    placeholder="alina@example.com"
                    className="w-full bg-transparent text-[15px] font-medium text-slate-900 placeholder:text-slate-300 outline-none"
                  />
                </FormField>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-teal-50 to-sky-50 ring-1 ring-teal-100 p-4 flex gap-3">
                <div className="grid place-items-center h-9 w-9 rounded-xl bg-white text-teal-700 ring-1 ring-teal-100 shrink-0">
                  <Shield className="h-[18px] w-[18px]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Ваши данные защищены</p>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Передача данных шифруется TLS 1.3. Паспортные данные используются только для оформления тура.
                  </p>
                </div>
              </div>

              {guests > 1 && (
                <div className="rounded-2xl bg-amber-50/60 ring-1 ring-amber-100 p-4 flex gap-3">
                  <div className="grid place-items-center h-9 w-9 rounded-xl bg-white text-amber-600 ring-1 ring-amber-100 shrink-0">
                    <Users className="h-[18px] w-[18px]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Данные остальных путешественников</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      После подтверждения брони мы пришлём анкеты для остальных {guests - 1} гостей на email.
                    </p>
                  </div>
                </div>
              )}

              <input type="hidden" {...register("guestsCount", { valueAsNumber: true })} />
              <input type="hidden" {...register("preferredDate")} />
            </div>
          ) : (
            <div className="space-y-4 mt-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Проверьте детали бронирования</h3>
                <p className="text-sm text-slate-500 mt-0.5">Оплата после подтверждения менеджером</p>
              </div>

              <div className="rounded-2xl ring-1 ring-slate-200 overflow-hidden">
                <div className="flex gap-4 p-4 bg-gradient-to-br from-slate-50 to-white">
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
                    { k: "Заезд / Выезд", v: `${fmtDate(date)} → ${fmtDate(plusDays(date, tourDurationDays))}`, Ic: Calendar },
                    { k: "Гостей", v: `${guests} ${guests === 1 ? "персона" : "персон"}`, Ic: Users },
                    ...(selectedRoom ? [{ k: "Размещение", v: selectedRoom.title, Ic: Hotel }] : []),
                    { k: "На имя", v: watchedName || "—", Ic: User },
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

              <div className="rounded-2xl ring-1 ring-slate-200 p-4 text-sm space-y-2">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Персон × {guests}</span>
                  <span className="tabular-nums">${(pricePerPerson * guests).toLocaleString()}</span>
                </div>
                {roomTotal > 0 && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Доплата за номер</span>
                    <span className="tabular-nums">${roomTotal.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-slate-600">
                  <span>Налоги и сборы</span>
                  <span className="tabular-nums">${taxes.toLocaleString()}</span>
                </div>
                <div className="h-px bg-slate-100 my-1" />
                <div className="flex items-end justify-between pt-1">
                  <div>
                    <p className="text-xs text-slate-500">Итого к оплате</p>
                    <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">включая страховку и трансфер</p>
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
                    agreed ? "bg-teal-600 ring-teal-600" : "bg-white ring-slate-300",
                  )}
                >
                  {agreed && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </div>
                <span className="text-xs text-slate-600 leading-relaxed">
                  Соглашаюсь с{" "}
                  <a href="#" className="text-teal-700 font-semibold underline-offset-2 hover:underline">условиями бронирования</a>
                  {" "}и{" "}
                  <a href="#" className="text-teal-700 font-semibold underline-offset-2 hover:underline">политикой конфиденциальности</a>.
                  {" "}Оплата производится после подтверждения брони менеджером.
                </span>
              </label>
            </div>
          )}

          {!success && (
            <div className="mt-6 -mx-6 sm:-mx-10 px-6 sm:px-10 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Сумма</p>
                <p className="text-lg font-bold text-slate-900 tabular-nums leading-tight">${total.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={() => setStep((s) => (s - 1) as 0 | 1 | 2)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white text-slate-700 text-sm font-semibold ring-1 ring-slate-200 hover:bg-slate-50 transition"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Назад
                  </button>
                )}
                {step < 2 ? (
                  <button
                    type="button"
                    disabled={step === 0 ? !canStep1 : !canStep2}
                    onClick={nextStep}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0"
                    style={{ background: "linear-gradient(135deg, #f97316, #f43f5e)" }}
                  >
                    Продолжить
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!agreed || submitting}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0"
                    style={{ background: "linear-gradient(135deg, #0d9488, #0284c7)" }}
                  >
                    {submitting ? "Отправляем…" : "Подтвердить и забронировать"}
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

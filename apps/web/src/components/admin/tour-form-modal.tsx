"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { SingleImageUploader } from "@/src/components/ui/single-image-uploader";
import { MultiImageUploader } from "@/src/components/ui/multi-image-uploader";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  X, Globe, Hotel, Utensils, DollarSign, Image as ImageIcon,
  CheckCircle2, XCircle, Settings, ChevronDown, Plus, Trash2, BedDouble,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { adminToursApi } from "@/src/shared/api/admin-tours-api";
import { extractErrorMessage } from "@/src/shared/api/apiClient";
import { cn } from "@/src/lib/utils";
import type { Tour, RoomTypeOption } from "@tours/types";

const schema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, "только a-z, 0-9 и дефис").min(3).max(120),

  titleRu: z.string().min(2, "Обязательно"),
  titleEn: z.string().optional(),

  descRu: z.string().min(10, "Минимум 10 символов"),
  descEn: z.string().optional(),

  country: z.string().min(2, "Обязательно"),
  city: z.string().optional(),

  hotelName: z.string().optional(),
  hotelStars: z.coerce.number().int().min(1).max(5),
  mealPlan: z.enum(["ALL_INCLUSIVE", "HALF_BOARD", "BREAKFAST", "NO_MEALS"]),
  durationDays: z.coerce.number().int().min(1).max(60),
  priceUsd: z.coerce.number().min(0),

  coverImage: z.string().min(5, "Загрузите обложку"),

  includedRu: z.string().optional(),
  includedEn: z.string().optional(),
  excludedRu: z.string().optional(),
  excludedEn: z.string().optional(),

  isHot: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
  referralThreshold: z.coerce.number().int().min(1).max(1000),
});

type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

function toLines(arr?: string[]): string {
  return arr?.join("\n") ?? "";
}
function fromLines(text?: string): string[] {
  return text ? text.split("\n").map(s => s.trim()).filter(Boolean) : [];
}

const SECTIONS = ["Основное", "Отель и тур", "Размещение", "Медиа", "Программа", "Настройки"] as const;
type Section = (typeof SECTIONS)[number];

export function TourFormModal({
  tour, onClose, onSaved,
}: {
  tour: Tour | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!tour;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<Section>("Основное");
  const [galleryImages, setGalleryImages] = useState<string[]>(tour?.images ?? []);
  const [roomTypes, setRoomTypes] = useState<RoomTypeOption[]>(
    (tour?.roomTypes ?? []) as RoomTypeOption[]
  );

  const {
    register, handleSubmit, setValue, watch, formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: tour ? {
      slug: tour.slug,
      titleRu: tour.title.ru,
      titleEn: tour.title.en ?? "",
      descRu: tour.description.ru,
      descEn: tour.description.en ?? "",
      country: tour.country,
      city: tour.city ?? "",
      hotelName: tour.hotelName ?? "",
      hotelStars: tour.hotelStars,
      mealPlan: tour.mealPlan,
      durationDays: tour.durationDays,
      priceUsd: tour.priceUsd,
      coverImage: tour.coverImage,
      includedRu: toLines(tour.programIncluded?.ru),
      includedEn: toLines(tour.programIncluded?.en),
      excludedRu: toLines(tour.programExcluded?.ru),
      excludedEn: toLines(tour.programExcluded?.en),
      isHot: tour.isHot,
      isActive: tour.isActive,
      referralThreshold: tour.referralThreshold,
    } : {
      slug: "",
      titleRu: "", titleEn: "",
      descRu: "", descEn: "",
      country: "", city: "",
      hotelName: "",
      hotelStars: 4,
      mealPlan: "BREAKFAST",
      durationDays: 7,
      priceUsd: 500,
      coverImage: "",
      includedRu: "", includedEn: "",
      excludedRu: "", excludedEn: "",
      isHot: false,
      isActive: true,
      referralThreshold: 50,
    },
  });

  const onSubmit = async (v: FormOutput) => {
    setSaving(true);
    setError(null);
    try {
      const includedRu = fromLines(v.includedRu);
      const includedEn = fromLines(v.includedEn);
      const excludedRu = fromLines(v.excludedRu);
      const excludedEn = fromLines(v.excludedEn);

      const payload = {
        slug: v.slug,
        title: { ru: v.titleRu, ...(v.titleEn ? { en: v.titleEn } : {}) },
        description: { ru: v.descRu, ...(v.descEn ? { en: v.descEn } : {}) },
        programIncluded: {
          ru: includedRu,
          ...(includedEn.length ? { en: includedEn } : {}),
        },
        programExcluded: {
          ru: excludedRu,
          ...(excludedEn.length ? { en: excludedEn } : {}),
        },
        country: v.country,
        city: v.city || undefined,
        hotelName: v.hotelName || undefined,
        hotelStars: v.hotelStars,
        mealPlan: v.mealPlan,
        durationDays: v.durationDays,
        priceUsd: v.priceUsd,
        coverImage: v.coverImage,
        images: galleryImages,
        roomTypes,
        isHot: v.isHot,
        ...(isEdit ? { isActive: v.isActive } : {}),
        referralThreshold: v.referralThreshold,
      };

      if (isEdit && tour) {
        await adminToursApi.update(tour.id, payload);
      } else {
        await adminToursApi.create(payload);
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-[0_40px_80px_-20px_rgba(15,23,42,0.4)] w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {isEdit ? "Редактировать тур" : "Новый тур"}
            </h3>
            {isEdit && (
              <p className="text-xs text-slate-400 mt-0.5 font-mono">{tour.slug}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid place-items-center h-8 w-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Section tabs */}
        <div className="flex gap-0 border-b border-slate-100 px-6 overflow-x-auto">
          {SECTIONS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setOpenSection(s)}
              className={cn(
                "px-3 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap border-b-2 transition-all",
                openSection === s
                  ? "border-teal-600 text-teal-700"
                  : "border-transparent text-slate-400 hover:text-slate-700",
              )}
            >
              {s}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">

            {/* ── Section: Основное ─────────────────── */}
            {openSection === "Основное" && (
              <>
                <Field label="Slug (URL)" error={errors.slug?.message} hint="Только a-z, 0-9 и дефис · нельзя изменить после создания">
                  <input
                    {...register("slug")}
                    disabled={isEdit}
                    placeholder="turkey-antalya-7nights"
                    className={fieldCls(!!errors.slug, isEdit)}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Название RU *" error={errors.titleRu?.message}>
                    <input {...register("titleRu")} placeholder="Турция — Анталья, 7 ночей" className={fieldCls(!!errors.titleRu)} />
                  </Field>
                  <Field label="Title EN">
                    <input {...register("titleEn")} placeholder="Turkey — Antalya, 7 nights" className={fieldCls(false)} />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Страна *" error={errors.country?.message}>
                    <input {...register("country")} placeholder="Турция" className={fieldCls(!!errors.country)} />
                  </Field>
                  <Field label="Город / курорт">
                    <input {...register("city")} placeholder="Анталья" className={fieldCls(false)} />
                  </Field>
                </div>

                <Field label="Описание RU *" error={errors.descRu?.message}>
                  <textarea
                    {...register("descRu")}
                    rows={4}
                    placeholder="Подробное описание тура..."
                    className={textareaCls(!!errors.descRu)}
                  />
                </Field>

                <Field label="Description EN">
                  <textarea
                    {...register("descEn")}
                    rows={3}
                    placeholder="Detailed tour description..."
                    className={textareaCls(false)}
                  />
                </Field>
              </>
            )}

            {/* ── Section: Отель и тур ──────────────── */}
            {openSection === "Отель и тур" && (
              <>
                <Field label="Название отеля">
                  <input {...register("hotelName")} placeholder="Kempinski Antalya" className={fieldCls(false)} />
                </Field>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Field label="Звёзды">
                    <input type="number" min={1} max={5} {...register("hotelStars")} className={fieldCls(false)} />
                  </Field>
                  <Field label="Дней">
                    <input type="number" min={1} max={60} {...register("durationDays")} className={fieldCls(false)} />
                  </Field>
                  <Field label="Цена $" error={errors.priceUsd?.message}>
                    <input type="number" step="0.01" min={0} {...register("priceUsd")} className={fieldCls(!!errors.priceUsd)} />
                  </Field>
                  <Field label="Питание">
                    <select {...register("mealPlan")} className={fieldCls(false)}>
                      <option value="ALL_INCLUSIVE">All inclusive</option>
                      <option value="HALF_BOARD">Полупансион</option>
                      <option value="BREAKFAST">Завтраки</option>
                      <option value="NO_MEALS">Без питания</option>
                    </select>
                  </Field>
                </div>

                <div className="rounded-xl bg-amber-50/60 ring-1 ring-amber-100 px-4 py-3 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isHot"
                    {...register("isHot")}
                    className="h-4 w-4 rounded text-rose-600 focus:ring-rose-400"
                  />
                  <label htmlFor="isHot" className="text-sm font-semibold text-slate-800 cursor-pointer">
                    🔥 Горящий тур — показывать первым в каталоге
                  </label>
                </div>
              </>
            )}

            {/* ── Section: Размещение ──────────────── */}
            {openSection === "Размещение" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Типы размещения</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Добавьте варианты номеров с доплатой. Если список пуст — шаг выбора скрыт при бронировании.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRoomTypes(prev => [
                      ...prev,
                      { id: `room-${Date.now()}`, title: "", desc: "", priceModifier: 0 },
                    ])}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Добавить
                  </button>
                </div>

                {roomTypes.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center text-slate-400">
                    <BedDouble className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Нет типов размещения — при бронировании шаг будет пропущен</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {roomTypes.map((rt, idx) => (
                      <div
                        key={rt.id}
                        className="rounded-2xl ring-1 ring-slate-200 bg-slate-50/40 p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Вариант {idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => setRoomTypes(prev => prev.filter((_, i) => i !== idx))}
                            className="grid place-items-center h-7 w-7 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            aria-label="Удалить"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Название *">
                            <input
                              value={rt.title}
                              onChange={e => setRoomTypes(prev => prev.map((r, i) => i === idx ? { ...r, title: e.target.value } : r))}
                              placeholder="Стандартный номер"
                              className={fieldCls(false)}
                            />
                          </Field>
                          <Field label="Доплата $">
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={rt.priceModifier}
                              onChange={e => setRoomTypes(prev => prev.map((r, i) => i === idx ? { ...r, priceModifier: Number(e.target.value) } : r))}
                              placeholder="0"
                              className={fieldCls(false)}
                            />
                          </Field>
                        </div>
                        <Field label="Описание (опц.)">
                          <input
                            value={rt.desc ?? ""}
                            onChange={e => setRoomTypes(prev => prev.map((r, i) => i === idx ? { ...r, desc: e.target.value } : r))}
                            placeholder="Уютный номер с балконом, вид на море"
                            className={fieldCls(false)}
                          />
                        </Field>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Section: Медиа ────────────────────── */}
            {openSection === "Медиа" && (
              <>
                <input type="hidden" {...register("coverImage")} />
                <SingleImageUploader
                  label="Обложка *"
                  hint="Главное фото тура · рекомендуется 1920×1080 · JPEG / PNG / WebP до 8 МБ"
                  value={watch("coverImage") ?? ""}
                  onChange={url => setValue("coverImage", url, { shouldValidate: true })}
                />
                {errors.coverImage && (
                  <p className="text-xs text-red-500 -mt-1">{errors.coverImage.message}</p>
                )}

                <MultiImageUploader
                  label="Галерея (дополнительные фото)"
                  hint="До 20 фото · показываются в галерее тура"
                  max={20}
                  value={galleryImages}
                  onChange={setGalleryImages}
                />
              </>
            )}

            {/* ── Section: Программа ───────────────── */}
            {openSection === "Программа" && (
              <>
                <div className="rounded-2xl bg-emerald-50/40 ring-1 ring-emerald-100 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <h4 className="font-bold text-slate-900">В стоимость включено</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="RU — один пункт на строку" hint="Пример: Перелёт туда-обратно">
                      <textarea
                        {...register("includedRu")}
                        rows={6}
                        placeholder={"Перелёт туда-обратно\nОтель 5★ (7 ночей)\nТрансфер аэропорт-отель\nСтраховка"}
                        className={textareaCls(false)}
                      />
                    </Field>
                    <Field label="EN — optional, same order">
                      <textarea
                        {...register("includedEn")}
                        rows={6}
                        placeholder={"Round-trip flights\n5★ Hotel (7 nights)\nAirport transfer\nInsurance"}
                        className={textareaCls(false)}
                      />
                    </Field>
                  </div>
                </div>

                <div className="rounded-2xl bg-rose-50/40 ring-1 ring-rose-100 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <XCircle className="h-5 w-5 text-rose-500" />
                    <h4 className="font-bold text-slate-900">Не включено</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="RU — один пункт на строку" hint="Пример: Виза">
                      <textarea
                        {...register("excludedRu")}
                        rows={6}
                        placeholder={"Виза\nЭкскурсии\nЛичные расходы\nАлкоголь"}
                        className={textareaCls(false)}
                      />
                    </Field>
                    <Field label="EN — optional, same order">
                      <textarea
                        {...register("excludedEn")}
                        rows={6}
                        placeholder={"Visa\nExcursions\nPersonal expenses\nAlcohol"}
                        className={textareaCls(false)}
                      />
                    </Field>
                  </div>
                </div>
              </>
            )}

            {/* ── Section: Настройки ───────────────── */}
            {openSection === "Настройки" && (
              <>
                <Field
                  label="Реферальный порог (чел.)"
                  hint="Сколько рефералов нужно привести для получения бесплатного тура"
                >
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    {...register("referralThreshold")}
                    className={fieldCls(false)}
                  />
                </Field>

                {isEdit && (
                  <div className="rounded-xl bg-slate-50 ring-1 ring-slate-200 px-4 py-3 flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isActive"
                      {...register("isActive")}
                      className="h-4 w-4 rounded text-teal-600 focus:ring-teal-400"
                    />
                    <label htmlFor="isActive" className="text-sm font-semibold text-slate-800 cursor-pointer">
                      Тур активен (показывается в каталоге)
                    </label>
                  </div>
                )}

                <div className="rounded-xl bg-sky-50/50 ring-1 ring-sky-100 p-4 text-sm text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800 mb-2">Дополнительные данные</p>
                  <p>· Slug изменить нельзя после создания</p>
                  <p>· Цена всегда в USD — конвертация на фронте</p>
                  <p>· После изменения данных ISR-кеш сбросится через 10 минут</p>
                </div>
              </>
            )}

          </div>

          {/* Footer */}
          <div className="px-6 pb-6">
            {error && (
              <div className="rounded-xl bg-rose-50 ring-1 ring-rose-200 px-4 py-3 text-sm text-rose-700 mb-4">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
                style={{ background: "linear-gradient(135deg, #0d9488, #0284c7)" }}
              >
                {saving ? "Сохранение…" : isEdit ? "Сохранить изменения" : "Создать тур"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              >
                Отмена
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Helpers ──────────────────────────────────────────────── */
const BASE_INPUT = "w-full rounded-xl text-sm text-slate-900 bg-white ring-1 px-3.5 py-2.5 outline-none transition-all focus:ring-2 placeholder:text-slate-300";

function fieldCls(hasError: boolean, disabled = false) {
  return cn(
    BASE_INPUT,
    hasError ? "ring-rose-300 focus:ring-rose-500/40" : "ring-slate-200 focus:ring-teal-500/40",
    disabled && "opacity-50 cursor-not-allowed bg-slate-50",
  );
}

function textareaCls(hasError: boolean) {
  return cn(
    BASE_INPUT,
    "resize-none leading-relaxed",
    hasError ? "ring-rose-300 focus:ring-rose-500/40" : "ring-slate-200 focus:ring-teal-500/40",
  );
}

function Field({
  label, hint, error, children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}

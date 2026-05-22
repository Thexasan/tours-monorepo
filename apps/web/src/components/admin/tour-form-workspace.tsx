"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { SingleImageUploader } from "@/src/components/ui/single-image-uploader";
import { MultiImageUploader } from "@/src/components/ui/multi-image-uploader";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Globe, Hotel, Image as ImageIcon, CheckCircle2, XCircle, Settings,
  Plus, Trash2, BedDouble, ChevronLeft, Calendar, DollarSign, Star, AlertCircle, ArrowLeft
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { adminToursApi } from "@/src/shared/api/admin-tours-api";
import { extractErrorMessage } from "@/src/shared/api/apiClient";
import { toast } from "sonner";
import { cn } from "@/src/lib/utils";
import type { Tour, RoomTypeOption } from "@tours/types";

const schema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, "Только a-z, 0-9 и дефис").min(3, "Минимум 3 символа").max(120),
  titleRu: z.string().min(2, "Обязательно"),
  titleEn: z.string().optional(),
  titleTr: z.string().optional(),
  descRu: z.string().min(10, "Минимум 10 символов"),
  descEn: z.string().optional(),
  descTr: z.string().optional(),
  country: z.string().min(2, "Обязательно"),
  city: z.string().optional(),
  hotelName: z.string().optional(),
  hotelStars: z.coerce.number().int().min(1).max(5),
  mealPlan: z.enum(["ALL_INCLUSIVE", "HALF_BOARD", "BREAKFAST", "NO_MEALS"]),
  durationDays: z.coerce.number().int().min(1).max(60),
  priceUsd: z.coerce.number().min(0, "Не может быть отрицательной"),
  coverImage: z.string().min(5, "Загрузите обложку"),
  includedRu: z.string().optional(),
  includedEn: z.string().optional(),
  includedTr: z.string().optional(),
  excludedRu: z.string().optional(),
  excludedEn: z.string().optional(),
  excludedTr: z.string().optional(),
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

const SECTIONS = [
  { id: "Основное", label: "Основное", icon: Globe },
  { id: "Отель и тур", label: "Отель и тур", icon: Hotel },
  { id: "Размещение", label: "Размещение", icon: BedDouble },
  { id: "Медиа", label: "Медиа", icon: ImageIcon },
  { id: "Программа", label: "Программа", icon: CheckCircle2 },
  { id: "Настройки", label: "Настройки", icon: Settings },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

// Mapping fields to sections for error count badges
const FIELD_SECTIONS: Record<string, SectionId> = {
  slug: "Основное",
  titleRu: "Основное",
  titleEn: "Основное",
  titleTr: "Основное",
  descRu: "Основное",
  descEn: "Основное",
  descTr: "Основное",
  country: "Основное",
  city: "Основное",
  hotelName: "Отель и тур",
  hotelStars: "Отель и тур",
  durationDays: "Отель и тур",
  priceUsd: "Отель и тур",
  mealPlan: "Отель и тур",
  isHot: "Отель и тур",
  coverImage: "Медиа",
  referralThreshold: "Настройки",
  isActive: "Настройки",
};

export function TourFormWorkspace({
  tour,
}: {
  tour: Tour | null;
}) {
  const router = useRouter();
  const isEdit = !!tour;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>("Основное");
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
      titleTr: tour.title.tr ?? "",
      descRu: tour.description.ru,
      descEn: tour.description.en ?? "",
      descTr: tour.description.tr ?? "",
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
      includedTr: toLines(tour.programIncluded?.tr),
      excludedRu: toLines(tour.programExcluded?.ru),
      excludedEn: toLines(tour.programExcluded?.en),
      excludedTr: toLines(tour.programExcluded?.tr),
      isHot: tour.isHot,
      isActive: tour.isActive,
      referralThreshold: tour.referralThreshold,
    } : {
      slug: "",
      titleRu: "", titleEn: "", titleTr: "",
      descRu: "", descEn: "", descTr: "",
      country: "", city: "",
      hotelName: "",
      hotelStars: 4,
      mealPlan: "BREAKFAST",
      durationDays: 7,
      priceUsd: 500,
      coverImage: "",
      includedRu: "", includedEn: "", includedTr: "",
      excludedRu: "", excludedEn: "", excludedTr: "",
      isHot: false,
      isActive: true,
      referralThreshold: 50,
    },
  });

  // Watch form fields for live preview and completion bar
  const formValues = watch() as unknown as FormOutput;

  // Calculate completion percentage
  const calculateProgress = () => {
    let score = 0;
    const total = 6;
    if (formValues.slug && formValues.slug.length >= 3) score++;
    if (formValues.titleRu && formValues.titleRu.length >= 2) score++;
    if (formValues.descRu && formValues.descRu.length >= 10) score++;
    if (formValues.country && formValues.country.length >= 2) score++;
    if (formValues.priceUsd && formValues.priceUsd > 0) score++;
    if (formValues.coverImage && formValues.coverImage.length > 5) score++;
    return Math.round((score / total) * 100);
  };

  const progress = calculateProgress();

  // Get errors count per section
  const getSectionErrorsCount = (sectionId: SectionId): number => {
    let count = 0;
    Object.keys(errors).forEach((key) => {
      if (FIELD_SECTIONS[key] === sectionId) {
        count++;
      }
    });
    return count;
  };

  const onSubmit = async (v: FormOutput) => {
    setSaving(true);
    setError(null);
    try {
      const includedRu = fromLines(v.includedRu);
      const includedEn = fromLines(v.includedEn);
      const includedTr = fromLines(v.includedTr);
      const excludedRu = fromLines(v.excludedRu);
      const excludedEn = fromLines(v.excludedEn);
      const excludedTr = fromLines(v.excludedTr);

      const payload = {
        slug: v.slug,
        title: {
          ru: v.titleRu,
          ...(v.titleEn ? { en: v.titleEn } : {}),
          ...(v.titleTr ? { tr: v.titleTr } : {}),
        },
        description: {
          ru: v.descRu,
          ...(v.descEn ? { en: v.descEn } : {}),
          ...(v.descTr ? { tr: v.descTr } : {}),
        },
        programIncluded: {
          ru: includedRu,
          ...(includedEn.length ? { en: includedEn } : {}),
          ...(includedTr.length ? { tr: includedTr } : {}),
        },
        programExcluded: {
          ru: excludedRu,
          ...(excludedEn.length ? { en: excludedEn } : {}),
          ...(excludedTr.length ? { tr: excludedTr } : {}),
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
        toast.success("Тур сохранён успешно");
      } else {
        await adminToursApi.create(payload);
        toast.success("Новый тур успешно создан");
      }
      router.push("/admin/tours");
      router.refresh();
    } catch (e) {
      const msg = extractErrorMessage(e);
      setError(msg);
      toast.error(isEdit ? "Не удалось сохранить тур" : "Не удалось создать тур", { description: msg });
    } finally {
      setSaving(false);
    }
  };

  const getMealPlanLabel = (plan?: string) => {
    switch (plan) {
      case "ALL_INCLUSIVE": return "Все включено";
      case "HALF_BOARD": return "Полупансион";
      case "BREAKFAST": return "Завтраки";
      case "NO_MEALS": return "Без питания";
      default: return "Завтраки";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in-up">
      {/* ── Header actions panel ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin/tours")}
            className="h-9 w-9 grid place-items-center bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                {isEdit ? "Редактировать тур" : "Создание нового тура"}
              </h2>
              {isEdit && (
                <span className={cn(
                  "px-2 py-0.5 rounded-lg text-[10px] font-semibold border",
                  tour?.isActive
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                    : "bg-slate-100 text-slate-500 border-slate-200"
                )}>
                  {tour?.isActive ? "Активен" : "В архиве"}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {isEdit ? `ID: ${tour.id} · ${tour.slug}` : "Заполните данные для создания карточки тура"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={() => router.push("/admin/tours")}
            className="h-9 px-4 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 font-semibold text-xs rounded-lg shadow-none transition-colors"
          >
            Отмена
          </Button>
          <Button
            type="button"
            disabled={saving}
            onClick={handleSubmit(onSubmit)}
            className="h-9 px-5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg shadow-none border-0 transition-colors cursor-pointer disabled:opacity-60"
          >
            {saving ? "Сохранение…" : isEdit ? "Сохранить тур" : "Опубликовать тур"}
          </Button>
        </div>
      </div>

      {/* ── Main Workspace Layout ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* 1. Left Sticky Navigation Stepper (col-span-3) */}
        <div className="lg:col-span-3 lg:sticky lg:top-6 space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Разделы формы</p>
            </div>
            <nav className="p-2 space-y-0.5">
              {SECTIONS.map((sec) => {
                const Icon = sec.icon;
                const isActive = activeSection === sec.id;
                const errCount = getSectionErrorsCount(sec.id);
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setActiveSection(sec.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer relative",
                      isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent"
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-emerald-600" />
                    )}
                    <div className="flex items-center gap-2.5">
                      <Icon className={cn("w-3.5 h-3.5", isActive ? "text-emerald-600" : "text-slate-400")} />
                      <span>{sec.label}</span>
                    </div>
                    {errCount > 0 && (
                      <span className="h-4.5 min-w-4.5 px-1 rounded bg-rose-500 text-white text-[9px] font-bold leading-none flex items-center justify-center">
                        {errCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Progress widget */}
          <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Готовность данных</span>
              <span className="text-xs font-mono font-bold text-emerald-700">{progress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-2.5 leading-relaxed">
              * Заполните Slug, Название, Страну, Цену, Описание и Обложку для достижения 100% готовности.
            </p>
          </div>
        </div>

        {/* 2. Central Form Component (col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-slate-200/80 rounded-xl shadow-sm p-6 space-y-5">
            {error && (
              <div className="rounded-xl bg-rose-50 ring-1 ring-rose-200 p-4 flex gap-3 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <p className="font-medium leading-relaxed">{error}</p>
              </div>
            )}

            {/* ── Section: Основное ─────────────────── */}
            {activeSection === "Основное" && (
              <div className="space-y-4">
                <div className="pb-2 border-b border-slate-100">
                  <h4 className="font-extrabold text-slate-800 text-sm">Основная информация</h4>
                  <p className="text-xs text-slate-400">Основные текстовые поля и география тура.</p>
                </div>

                <Field label="Slug (URL)" error={errors.slug?.message} hint="Только строчные латинские буквы, цифры и дефис · Нельзя изменить после создания">
                  <input
                    {...register("slug")}
                    disabled={isEdit}
                    placeholder="turkey-antalya-7nights"
                    className={fieldCls(!!errors.slug, isEdit)}
                  />
                </Field>

                <Field label="Название RU *" error={errors.titleRu?.message}>
                  <input {...register("titleRu")} placeholder="Турция — Анталья, 7 ночей" className={fieldCls(!!errors.titleRu)} />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Название EN (опц.)">
                    <input {...register("titleEn")} placeholder="Turkey — Antalya, 7 nights" className={fieldCls(false)} />
                  </Field>
                  <Field label="Название TR (опц.)">
                    <input {...register("titleTr")} placeholder="Türkiye — Antalya, 7 gece" className={fieldCls(false)} />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Страна *" error={errors.country?.message}>
                    <input {...register("country")} placeholder="Турция" className={fieldCls(!!errors.country)} />
                  </Field>
                  <Field label="Город / курорт (опц.)">
                    <input {...register("city")} placeholder="Анталья" className={fieldCls(false)} />
                  </Field>
                </div>

                <Field label="Описание RU *" error={errors.descRu?.message}>
                  <textarea
                    {...register("descRu")}
                    rows={5}
                    placeholder="Подробное описание программы, отеля и условий..."
                    className={textareaCls(!!errors.descRu)}
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Описание EN (опц.)">
                    <textarea
                      {...register("descEn")}
                      rows={4}
                      placeholder="Detailed tour description in English..."
                      className={textareaCls(false)}
                    />
                  </Field>
                  <Field label="Описание TR (опц.)">
                    <textarea
                      {...register("descTr")}
                      rows={4}
                      placeholder="Türkiye turu hakkında detaylı açıklama..."
                      className={textareaCls(false)}
                    />
                  </Field>
                </div>
              </div>
            )}

            {/* ── Section: Отель и тур ──────────────── */}
            {activeSection === "Отель и тур" && (
              <div className="space-y-4">
                <div className="pb-2 border-b border-slate-100">
                  <h4 className="font-extrabold text-slate-800 text-sm">Параметры отеля и тура</h4>
                  <p className="text-xs text-slate-400">Стоимость, звездность отеля и план питания.</p>
                </div>

                <Field label="Название отеля">
                  <input {...register("hotelName")} placeholder="Kempinski Hotel The Dome" className={fieldCls(false)} />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Звёздность (1-5)">
                    <input type="number" min={1} max={5} {...register("hotelStars")} className={fieldCls(false)} />
                  </Field>
                  <Field label="Дней">
                    <input type="number" min={1} max={60} {...register("durationDays")} className={fieldCls(false)} />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Цена в USD ($) *" error={errors.priceUsd?.message}>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="number" step="0.01" min={0} {...register("priceUsd")} className={cn(fieldCls(!!errors.priceUsd), "pl-8")} />
                    </div>
                  </Field>

                  <Field label="Тип питания">
                    <select {...register("mealPlan")} className={fieldCls(false)}>
                      <option value="ALL_INCLUSIVE">All inclusive (Все включено)</option>
                      <option value="HALF_BOARD">Полупансион (Завтрак + Ужин)</option>
                      <option value="BREAKFAST">Завтраки</option>
                      <option value="NO_MEALS">Без питания</option>
                    </select>
                  </Field>
                </div>

                <div className="border border-slate-200/80 rounded-lg p-4 flex items-start gap-3 bg-slate-50/40">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      id="isHot"
                      {...register("isHot")}
                      className="h-4 w-4 rounded text-emerald-700 focus:ring-emerald-600 border-slate-300"
                    />
                  </div>
                  <label htmlFor="isHot" className="text-xs font-semibold text-slate-700 cursor-pointer leading-normal">
                    🔥 Горящий тур — показывать первым в каталоге, выделять специальным бейджем и анимацией.
                  </label>
                </div>
              </div>
            )}

            {/* ── Section: Размещение ──────────────── */}
            {activeSection === "Размещение" && (
              <div className="space-y-4">
                <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm">Типы размещения</h4>
                    <p className="text-xs text-slate-400">Добавьте типы комнат и доплаты за них.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRoomTypes(prev => [
                      ...prev,
                      { id: `room-${Date.now()}`, title: "", desc: "", priceModifier: 0 },
                    ])}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-[10px] font-semibold hover:bg-emerald-800 transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Добавить
                  </button>
                </div>

                {roomTypes.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-slate-200/70 p-8 text-center text-slate-400 select-none">
                    <BedDouble className="h-8 w-8 mx-auto mb-2 text-slate-300 animate-pulse-subtle" />
                    <p className="text-xs font-bold text-slate-500">Нет типов размещения</p>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-[240px] mx-auto leading-normal">
                      При бронировании шаг выбора комнат будет пропущен, клиент забронирует базовый номер.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
                    {roomTypes.map((rt, idx) => (
                      <div
                        key={rt.id}
                        className="rounded-xl border border-slate-200/70 bg-slate-50/30 p-4 space-y-3 shadow-3xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Вариант {idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => setRoomTypes(prev => prev.filter((_, i) => i !== idx))}
                            className="grid place-items-center h-6.5 w-6.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100/50 transition cursor-pointer"
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
                              placeholder="Standard Sea View"
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
                        <Field label="Описание комнаты (опц.)">
                          <input
                            value={rt.desc ?? ""}
                            onChange={e => setRoomTypes(prev => prev.map((r, i) => i === idx ? { ...r, desc: e.target.value } : r))}
                            placeholder="Уютный номер 32м², прямой вид на океан"
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
            {activeSection === "Медиа" && (
              <div className="space-y-4">
                <div className="pb-2 border-b border-slate-100">
                  <h4 className="font-extrabold text-slate-800 text-sm">Галерея и обложка</h4>
                  <p className="text-xs text-slate-400">Загрузите фотографии для красочной демонстрации тура.</p>
                </div>

                <input type="hidden" {...register("coverImage")} />
                <div>
                  <SingleImageUploader
                    label="Главная обложка *"
                    hint="Будет показываться в списках и как фон карточки. Рекомендуемое разрешение 1920×1080. Лимит 8 МБ."
                    value={formValues.coverImage ?? ""}
                    onChange={url => setValue("coverImage", url, { shouldValidate: true })}
                  />
                  {errors.coverImage && (
                    <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-bold">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.coverImage.message}
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <MultiImageUploader
                    label="Галерея тура (дополнительно)"
                    hint="Загрузите до 20 фото отеля, пляжей и местных достопримечательностей."
                    max={20}
                    value={galleryImages}
                    onChange={setGalleryImages}
                  />
                </div>
              </div>
            )}

            {/* ── Section: Программа ───────────────── */}
            {activeSection === "Программа" && (
              <div className="space-y-4">
                <div className="pb-2 border-b border-slate-100">
                  <h4 className="font-extrabold text-slate-800 text-sm">Программа и условия</h4>
                  <p className="text-xs text-slate-400">Укажите списком, что входит в стоимость, а за что придется доплатить.</p>
                </div>

                <div className="border border-slate-200/80 rounded-lg p-4 space-y-4 bg-slate-50/30">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <h5 className="font-semibold text-slate-700 text-xs uppercase tracking-wider">В стоимость включено</h5>
                  </div>
                  <Field label="На русском — по одному на строку" hint="Пример: Прямой авиаперелет">
                    <textarea
                      {...register("includedRu")}
                      rows={5}
                      placeholder={"Авиаперелёт туда и обратно\nПроживание в отеле (7 ночей)\nТрансфер аэропорт-отель-аэропорт\nМедицинская страховка"}
                      className={textareaCls(false)}
                    />
                  </Field>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="На английском (опц.)">
                      <textarea
                        {...register("includedEn")}
                        rows={4}
                        placeholder={"Round-trip airfare\nHotel accommodation (7 nights)\nAirport transfer\nMedical insurance"}
                        className={textareaCls(false)}
                      />
                    </Field>
                    <Field label="На турецком (опц.)">
                      <textarea
                        {...register("includedTr")}
                        rows={4}
                        placeholder={"Gidiş-dönüş uçuş\nOtel konaklaması (7 gece)\nHavalimanı transferi\nSağlık sigortası"}
                        className={textareaCls(false)}
                      />
                    </Field>
                  </div>
                </div>

                <div className="border border-slate-200/80 rounded-lg p-4 space-y-4 bg-slate-50/30">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-rose-500" />
                    <h5 className="font-semibold text-slate-700 text-xs uppercase tracking-wider">Оплачивается отдельно</h5>
                  </div>
                  <Field label="На русском — по одному на строку" hint="Пример: Оформление визы">
                    <textarea
                      {...register("excludedRu")}
                      rows={5}
                      placeholder={"Виза\nЭкскурсии на месте\nЛичные расходы\nАлкоголь"}
                      className={textareaCls(false)}
                    />
                  </Field>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="На английском (опц.)">
                      <textarea
                        {...register("excludedEn")}
                        rows={4}
                        placeholder={"Visa processing fee\nLocal excursions\nPersonal spendings\nAlcohol"}
                        className={textareaCls(false)}
                      />
                    </Field>
                    <Field label="На турецком (опц.)">
                      <textarea
                        {...register("excludedTr")}
                        rows={4}
                        placeholder={"Vize ücreti\nYerel turlar\nKişisel harcamalar\nAlkol"}
                        className={textareaCls(false)}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            )}

            {/* ── Section: Настройки ───────────────── */}
            {activeSection === "Настройки" && (
              <div className="space-y-4">
                <div className="pb-2 border-b border-slate-100">
                  <h4 className="font-extrabold text-slate-800 text-sm">Глобальные настройки</h4>
                  <p className="text-xs text-slate-400">Технические параметры и реферальный порог.</p>
                </div>

                <Field
                  label="Реферальный порог (кол-во чел.)"
                  hint="Количество людей, которые должны забронировать тур по ссылке клиента, чтобы он получил тур бесплатно."
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
                  <div className="border border-slate-200/80 rounded-lg p-4 flex items-start gap-3 bg-slate-50/40">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        id="isActive"
                        {...register("isActive")}
                        className="h-4 w-4 rounded text-emerald-700 focus:ring-emerald-600 border-slate-300"
                      />
                    </div>
                    <label htmlFor="isActive" className="text-xs font-semibold text-slate-700 cursor-pointer leading-normal">
                      Опубликовать тур на сайте (активен). Если галочка снята, тур будет перенесен в архив и скроется из каталогов клиентов.
                    </label>
                  </div>
                )}

                <div className="rounded-xl bg-slate-50 border border-slate-200/50 p-4 text-[10.5px] text-slate-500 space-y-2 leading-relaxed">
                  <p className="font-bold text-slate-700 uppercase tracking-wider text-[9px] mb-1">Справка для контент-менеджера:</p>
                  <p>· Slug генерируется один раз и выступает уникальным ключом URL. Изменить его после создания невозможно.</p>
                  <p>· Базовая стоимость указывается исключительно в долларах США (USD). Конвертация в локальную валюту происходит автоматически на стороне клиента.</p>
                  <p>· Изменения карточки кэшируются. Сброс кэша каталога (ISR) произойдет автоматически в течение 10 минут после сохранения.</p>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* 3. Right Sticky Live Tour Card Preview (col-span-4) */}
        <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
            {/* Live preview header status */}
            <div className="px-5 py-3 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Интерактивный предпросмотр</span>
              <span className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Client Card
              </span>
            </div>

            {/* Simulating Tour Card */}
            <div className="p-5">
              <div className="group relative rounded-2xl overflow-hidden border border-slate-200/80 bg-white shadow-md hover:shadow-lg transition-all duration-300 w-full max-w-[340px] mx-auto select-none">
                
                {/* Image Section */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                  {formValues.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={formValues.coverImage}
                      alt="Tour Cover Preview"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2 border-b border-slate-100">
                      <ImageIcon className="w-8 h-8 text-slate-300 animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400/80">Фото обложки</span>
                    </div>
                  )}

                  {/* Hot Badge */}
                  {formValues.isHot && (
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md shadow-emerald-500/20 flex items-center gap-1 animate-pulse-subtle">
                      🔥 Горящий
                    </div>
                  )}

                  {/* Price overlay */}
                  <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-xs text-white text-xs font-black font-mono px-3 py-1.5 rounded-xl border border-white/10 shadow-sm">
                    ${formValues.priceUsd ? Number(formValues.priceUsd).toLocaleString() : "0"}
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-4 space-y-2.5">
                  {/* Country / City */}
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>{formValues.country || "СТРАНА"}</span>
                    {formValues.city && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span className="text-slate-500">{formValues.city}</span>
                      </>
                    )}
                  </div>

                  {/* Tour Title */}
                  <h4 className="font-extrabold text-slate-800 text-sm leading-snug line-clamp-2 min-h-8">
                    {formValues.titleRu || "Турция — Анталья, 7 ночей"}
                  </h4>

                  {/* Divider */}
                  <div className="h-px bg-slate-100" />

                  {/* Stars, Hotel Name & Meal Plan */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 truncate max-w-[140px]" title={formValues.hotelName}>
                        {formValues.hotelName || "Название отеля"}
                      </span>
                      {formValues.hotelStars && (
                        <div className="flex items-center text-amber-500 bg-amber-500/5 px-1.5 py-0.5 rounded border border-amber-500/10 scale-90">
                          {Array.from({ length: formValues.hotelStars }).map((_, i) => (
                            <Star key={i} className="w-2.5 h-2.5 fill-current" />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formValues.durationDays || 7} дней</span>
                      </div>
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      <span>{getMealPlanLabel(formValues.mealPlan)}</span>
                    </div>
                  </div>

                  {/* Simulation of Action Button */}
                  <div className="pt-2">
                    <div className="w-full text-center py-2 bg-slate-50 border border-slate-200/50 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-wider">
                      Забронировать тур
                    </div>
                  </div>
                </div>

              </div>
            </div>
            
            {/* Visual warning alerts list inside preview */}
            <div className="px-5 pb-5 pt-1 border-t border-slate-100 space-y-2 bg-slate-50/50">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mt-2 mb-1.5">Статус данных</span>
              <div className="space-y-1.5">
                {(!formValues.slug || formValues.slug.length < 3) && (
                  <ValidationMessage text="URL-адрес (Slug) не заполнен или слишком короткий" type="warning" />
                )}
                {(!formValues.titleRu || formValues.titleRu.length < 2) && (
                  <ValidationMessage text="Отсутствует обязательное название на русском языке" type="error" />
                )}
                {(!formValues.country || formValues.country.length < 2) && (
                  <ValidationMessage text="Укажите страну проведения тура" type="error" />
                )}
                {(!formValues.coverImage || formValues.coverImage.length < 5) && (
                  <ValidationMessage text="Не загружено главное фото обложки" type="warning" />
                )}
                {formValues.priceUsd <= 0 && (
                  <ValidationMessage text="Установлена нулевая стоимость тура" type="warning" />
                )}
                {progress === 100 && (
                  <ValidationMessage text="Все обязательные поля корректно заполнены. Карточка полностью готова к публикации!" type="success" />
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ─── Field layout helper ─────────────────── */
function Field({
  label, hint, error, children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5 w-full">
      <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-[10px] text-slate-400 leading-normal">{hint}</p>}
      {error && <p className="text-xs text-rose-600 font-semibold flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}</p>}
    </div>
  );
}

/* ─── Validation status alert inside preview sidebar ─────────────────── */
function ValidationMessage({ text, type }: { text: string; type: "error" | "warning" | "success" }) {
  const styles = {
    error: "bg-rose-50 text-rose-700 border-rose-100",
    warning: "bg-amber-50 text-amber-700 border-amber-100",
    success: "bg-emerald-50 text-emerald-700 border-emerald-100",
  };
  return (
    <div className={cn("px-2.5 py-1.5 rounded-lg border text-[10px] font-medium leading-normal flex items-start gap-1.5", styles[type])}>
      <span className="h-1.5 w-1.5 rounded-full mt-1 shrink-0 bg-current animate-pulse-subtle" />
      <span>{text}</span>
    </div>
  );
}

/* ─── HTML Input Class styles ─────────────────── */
const BASE_INPUT = "w-full rounded-lg text-xs text-slate-900 bg-white border px-3.5 py-2.5 outline-none transition-colors placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-600/15";

function fieldCls(hasError: boolean, disabled = false) {
  return cn(
    BASE_INPUT,
    hasError
      ? "border-rose-300 focus:border-rose-400 focus:ring-rose-500/15"
      : "border-slate-200 hover:border-slate-300 focus:border-emerald-600/50",
    disabled && "opacity-50 cursor-not-allowed bg-slate-50 border-slate-200",
  );
}

function textareaCls(hasError: boolean) {
  return cn(
    BASE_INPUT,
    "resize-none leading-relaxed",
    hasError
      ? "border-rose-300 focus:border-rose-400 focus:ring-rose-500/15"
      : "border-slate-200 hover:border-slate-300 focus:border-emerald-600/50",
  );
}

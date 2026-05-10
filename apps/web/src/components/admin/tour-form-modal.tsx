"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { adminToursApi } from "@/src/shared/api/admin-tours-api";
import { extractErrorMessage } from "@/src/shared/api/apiClient";
import type { Tour } from "@tours/types";

const schema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, "только латиница, цифры и -").min(3).max(120),
  titleRu: z.string().min(2),
  titleEn: z.string().optional(),
  descRu: z.string().min(10),
  descEn: z.string().optional(),
  country: z.string().min(2),
  city: z.string().optional(),
  hotelName: z.string().optional(),
  hotelStars: z.coerce.number().int().min(1).max(5),
  mealPlan: z.enum(["ALL_INCLUSIVE", "HALF_BOARD", "BREAKFAST", "NO_MEALS"]),
  durationDays: z.coerce.number().int().min(1).max(60),
  priceUsd: z.coerce.number().min(0),
  coverImage: z.string().url("Должен быть валидным URL"),
  imagesText: z.string().optional(),
  isHot: z.coerce.boolean().optional(),
  referralThreshold: z.coerce.number().int().min(1).max(1000),
});
type Input = z.input<typeof schema>;
type Output = z.output<typeof schema>;

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

  const {
    register, handleSubmit, formState: { errors },
  } = useForm<Input, unknown, Output>({
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
      imagesText: tour.images.join("\n"),
      isHot: tour.isHot,
      referralThreshold: tour.referralThreshold,
    } : {
      slug: "",
      titleRu: "", titleEn: "",
      descRu: "", descEn: "",
      country: "",
      hotelStars: 4,
      mealPlan: "BREAKFAST",
      durationDays: 7,
      priceUsd: 500,
      coverImage: "",
      isHot: false,
      referralThreshold: 50,
    },
  });

  const onSubmit = async (v: Output) => {
    setSaving(true); setError(null);
    try {
      const payload = {
        slug: v.slug,
        title: { ru: v.titleRu, ...(v.titleEn ? { en: v.titleEn } : {}) },
        description: { ru: v.descRu, ...(v.descEn ? { en: v.descEn } : {}) },
        country: v.country,
        city: v.city || undefined,
        hotelName: v.hotelName || undefined,
        hotelStars: v.hotelStars,
        mealPlan: v.mealPlan,
        durationDays: v.durationDays,
        priceUsd: v.priceUsd,
        coverImage: v.coverImage,
        images: v.imagesText ? v.imagesText.split("\n").map((s) => s.trim()).filter(Boolean) : [],
        isHot: v.isHot,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-zinc-200 sticky top-0 bg-white z-10">
          <h3 className="text-lg font-semibold">{isEdit ? "Редактировать тур" : "Новый тур"}</h3>
          <button type="button" onClick={onClose} aria-label="Закрыть" className="text-zinc-400 hover:text-zinc-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 flex flex-col gap-4">
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" {...register("slug")} placeholder="turkey-antalya-7days" disabled={isEdit} />
            {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="titleRu">Название (RU)</Label>
              <Input id="titleRu" {...register("titleRu")} />
              {errors.titleRu && <p className="mt-1 text-xs text-red-600">{errors.titleRu.message}</p>}
            </div>
            <div>
              <Label htmlFor="titleEn">Title (EN)</Label>
              <Input id="titleEn" {...register("titleEn")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="descRu">Описание (RU)</Label>
              <textarea id="descRu" rows={3} {...register("descRu")}
                className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950" />
              {errors.descRu && <p className="mt-1 text-xs text-red-600">{errors.descRu.message}</p>}
            </div>
            <div>
              <Label htmlFor="descEn">Description (EN)</Label>
              <textarea id="descEn" rows={3} {...register("descEn")}
                className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="country">Страна</Label>
              <Input id="country" {...register("country")} />
              {errors.country && <p className="mt-1 text-xs text-red-600">{errors.country.message}</p>}
            </div>
            <div>
              <Label htmlFor="city">Город</Label>
              <Input id="city" {...register("city")} />
            </div>
            <div>
              <Label htmlFor="hotelName">Отель</Label>
              <Input id="hotelName" {...register("hotelName")} />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <Label htmlFor="hotelStars">Звёзды</Label>
              <Input id="hotelStars" type="number" min={1} max={5} {...register("hotelStars")} />
            </div>
            <div>
              <Label htmlFor="mealPlan">Питание</Label>
              <select
                id="mealPlan"
                {...register("mealPlan")}
                className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
              >
                <option value="ALL_INCLUSIVE">All inclusive</option>
                <option value="HALF_BOARD">Полупансион</option>
                <option value="BREAKFAST">Завтраки</option>
                <option value="NO_MEALS">Без питания</option>
              </select>
            </div>
            <div>
              <Label htmlFor="durationDays">Дней</Label>
              <Input id="durationDays" type="number" min={1} max={60} {...register("durationDays")} />
            </div>
            <div>
              <Label htmlFor="priceUsd">Цена $</Label>
              <Input id="priceUsd" type="number" step="0.01" min={0} {...register("priceUsd")} />
            </div>
          </div>

          <div>
            <Label htmlFor="coverImage">Cover image (URL)</Label>
            <Input id="coverImage" type="url" {...register("coverImage")} />
            {errors.coverImage && <p className="mt-1 text-xs text-red-600">{errors.coverImage.message}</p>}
          </div>

          <div>
            <Label htmlFor="imagesText">Дополнительные фото (URL по одному на строку)</Label>
            <textarea id="imagesText" rows={3} {...register("imagesText")}
              className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-mono shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="referralThreshold">Реф-порог (чел.)</Label>
              <Input id="referralThreshold" type="number" min={1} max={1000} {...register("referralThreshold")} />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register("isHot")} className="w-4 h-4" />
                <span className="text-sm">🔥 Горящий тур</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
          )}

          <div className="flex gap-3 mt-2">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? "Сохранение..." : isEdit ? "Сохранить" : "Создать"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Отмена
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

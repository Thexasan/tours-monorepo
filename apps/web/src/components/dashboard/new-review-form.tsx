"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Star } from "lucide-react";
import { reviewsApi } from "@/src/shared/api/reviews-api";
import { bookingsApi } from "@/src/shared/api/bookings-api";
import { extractErrorMessage } from "@/src/shared/api/apiClient";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { MultiImageUploader } from "@/src/components/ui/multi-image-uploader";

const schema = z.object({
  tourId: z.string().min(1, "Выберите тур"),
  rating: z.coerce.number().int().min(1).max(5),
  text: z.string().min(10, "Минимум 10 символов").max(2000),
});
type Inp = z.input<typeof schema>;
type Out = z.output<typeof schema>;

interface EligibleTour { tourId: string; title: string; bookingId: string; }

export function NewReviewForm() {
  const router = useRouter();
  const locale = useLocale();
  const lang = locale as "ru" | "en" | "tr";
  const [eligibleTours, setEligibleTours] = useState<EligibleTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  const { register, handleSubmit, setValue, watch, formState: { errors } } =
    useForm<Inp, unknown, Out>({
      resolver: zodResolver(schema),
      defaultValues: { tourId: "", rating: 5, text: "" },
    });

  const ratingVal = watch("rating") ?? 5;

  useEffect(() => {
    bookingsApi.listMy({ pageSize: 100 })
      .then((r) => {
        const eligibleSet = new Map<string, EligibleTour>();
        for (const b of r.items) {
          if ((b.status === "PAID" || b.status === "COMPLETED") && b.tour) {
            const title = b.tour.title[lang] ?? b.tour.title.ru ?? b.tour.slug;
            eligibleSet.set(b.tour.id, { tourId: b.tour.id, title, bookingId: b.id });
          }
        }
        setEligibleTours(Array.from(eligibleSet.values()));
      })
      .finally(() => setLoading(false));
  }, [lang]);

  const onSubmit = async (v: Out) => {
    setSubmitting(true); setError(null);
    try {
      await reviewsApi.create({
        tourId: v.tourId,
        rating: v.rating,
        text: v.text,
        photoUrls,
      });
      toast.success("Отзыв отправлен на модерацию");
      router.push(`/${locale}/dashboard/reviews`);
    } catch (e) {
      const msg = extractErrorMessage(e);
      setError(msg);
      toast.error("Не удалось отправить отзыв", { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-zinc-500">Загрузка ваших туров…</div>;

  if (eligibleTours.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-800">
        У вас пока нет оплаченных туров. Отзыв можно оставить только после оплаты заявки.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-zinc-200 p-6 max-w-2xl flex flex-col gap-4">
      <div>
        <Label htmlFor="tourId">Тур</Label>
        <select
          id="tourId" {...register("tourId")}
          className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-teal-500/15 focus:border-teal-500 transition-all"
        >
          <option value="">— Выберите тур —</option>
          {eligibleTours.map((t) => (
            <option key={t.tourId} value={t.tourId}>{t.title}</option>
          ))}
        </select>
        {errors.tourId && <p className="mt-1 text-xs text-red-600">{errors.tourId.message}</p>}
      </div>

      <div>
        <Label>Оценка</Label>
        <div className="flex items-center gap-1 mt-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button" key={n}
              onClick={() => setValue("rating", n)}
              className="cursor-pointer"
            >
              <Star className={`w-7 h-7 transition-colors ${n <= Number(ratingVal) ? "fill-amber-400 text-amber-400" : "text-zinc-300 hover:text-amber-300"}`} />
            </button>
          ))}
          <span className="ml-2 text-sm text-zinc-600">{String(ratingVal)}/5</span>
        </div>
        <input type="hidden" {...register("rating")} />
      </div>

      <div>
        <Label htmlFor="text">Текст отзыва</Label>
        <textarea
          id="text" rows={5} {...register("text")}
          placeholder="Расскажите, как прошёл тур, что понравилось, что нет..."
          className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500/15 focus:border-teal-500 transition-all"
        />
        {errors.text && <p className="mt-1 text-xs text-red-600">{errors.text.message}</p>}
      </div>

      <div>
        <MultiImageUploader
          label="Фото (необязательно)"
          hint="До 10 фото · JPEG / PNG / WebP до 8 МБ каждое"
          max={10}
          value={photoUrls}
          onChange={setPhotoUrls}
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
      )}

      <Button type="submit" disabled={submitting}>
        {submitting ? "Отправляем…" : "Отправить на модерацию"}
      </Button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Check, X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { bookingsApi } from "@/src/shared/api/bookings-api";
import { extractErrorMessage } from "@/src/shared/api/apiClient";

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
  open: boolean;
  onClose: () => void;
}

export function BookingModal({ tourId, tourTitle, pricePerPerson, open, onClose }: BookingModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register, handleSubmit, watch, formState: { errors }, reset,
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { guestsCount: 1, contactName: "", contactEmail: "", contactPhone: "" },
  });

  const guestsCount = watch("guestsCount") ?? 1;
  const totalPrice = pricePerPerson * Number(guestsCount || 1);

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

  const handleClose = () => {
    setSuccess(false);
    setError(null);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={handleClose}>
      <div
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 z-10"
          aria-label="Закрыть"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          {success ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 mb-2">Заявка отправлена!</h3>
              <p className="text-zinc-600 mb-6">Менеджер свяжется с вами в течение часа.</p>
              <Button onClick={handleClose}>Закрыть</Button>
            </div>
          ) : (
            <>
              <h3 className="text-xl font-semibold text-zinc-900 mb-1">Заявка на тур</h3>
              <p className="text-sm text-zinc-600 mb-6 line-clamp-2">{tourTitle}</p>

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="contactName">Имя и фамилия</Label>
                  <Input id="contactName" {...register("contactName")} />
                  {errors.contactName && <p className="mt-1 text-xs text-red-600">{errors.contactName.message}</p>}
                </div>

                <div>
                  <Label htmlFor="contactEmail">Email</Label>
                  <Input id="contactEmail" type="email" {...register("contactEmail")} />
                  {errors.contactEmail && <p className="mt-1 text-xs text-red-600">{errors.contactEmail.message}</p>}
                </div>

                <div>
                  <Label htmlFor="contactPhone">Телефон</Label>
                  <Input id="contactPhone" type="tel" placeholder="+998..." {...register("contactPhone")} />
                  {errors.contactPhone && <p className="mt-1 text-xs text-red-600">{errors.contactPhone.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="guestsCount">Гости</Label>
                    <Input id="guestsCount" type="number" min={1} max={20} {...register("guestsCount")} />
                  </div>
                  <div>
                    <Label htmlFor="preferredDate">Желаемая дата</Label>
                    <Input id="preferredDate" type="date" {...register("preferredDate")} />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Комментарий</Label>
                  <textarea
                    id="notes"
                    {...register("notes")}
                    rows={3}
                    className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                    placeholder="Особые пожелания, вопросы..."
                  />
                </div>

                {error && (
                  <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="rounded-md bg-zinc-50 border border-zinc-200 p-3 text-sm">
                  <span className="text-zinc-600">Итого: </span>
                  <span className="font-semibold text-zinc-900">${totalPrice}</span>
                  <span className="text-zinc-500 text-xs ml-2">({guestsCount} × ${pricePerPerson})</span>
                </div>

                <Button type="submit" disabled={submitting} className="mt-2">
                  {submitting ? "Отправляем..." : "Отправить заявку"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useRequireAuth } from "@/src/shared/hooks/use-require-auth";
import { partnersApi } from "@/src/shared/api/partners-api";
import { extractErrorMessage } from "@/src/shared/api/apiClient";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import type { PartnerApplication } from "@tours/types";

const schema = z.object({
  motivation: z.string().min(20, "Минимум 20 символов").max(2000),
  socialLinks: z.string().optional(),
  audienceSize: z.coerce.number().int().min(0).max(100_000_000).optional(),
});
type Inp = z.input<typeof schema>;
type Out = z.output<typeof schema>;

const STATUS_TEXT: Record<string, { title: string; cls: string; descr: string }> = {
  PENDING: { title: "Заявка на рассмотрении", cls: "bg-amber-50 border-amber-200 text-amber-800", descr: "Мы пришлём письмо, как только примем решение." },
  APPROVED: { title: "✅ Заявка одобрена", cls: "bg-emerald-50 border-emerald-200 text-emerald-800", descr: "Поздравляем! Теперь ты партнёр. Перейди в кабинет партнёра." },
  REJECTED: { title: "Заявка отклонена", cls: "bg-red-50 border-red-200 text-red-800", descr: "Можешь подать заявку повторно с обновлённой информацией." },
};

export function BecomePartnerForm() {
  const { user, isHydrated } = useRequireAuth();
  const router = useRouter();
  const locale = useLocale();
  const [application, setApplication] = useState<PartnerApplication | null>(null);
  const [loadingApp, setLoadingApp] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<Inp, unknown, Out>({
    resolver: zodResolver(schema),
    defaultValues: { motivation: "", socialLinks: "" },
  });

  useEffect(() => {
    if (!user) return;
    partnersApi.getMy()
      .then((app) => {
        setApplication(app);
        if (app && app.status === "REJECTED") {
          reset({ motivation: app.motivation, socialLinks: app.socialLinks.join("\n") });
        }
      })
      .finally(() => setLoadingApp(false));
  }, [user, reset]);

  if (!isHydrated || !user) return <div className="text-zinc-500">Проверяем авторизацию…</div>;
  if (user.role === "ADMIN") return <div className="text-zinc-600">Админы не могут быть партнёрами.</div>;
  if (user.role === "PARTNER" || user.isPartnerApproved) {
    return (
      <div className="rounded-md bg-emerald-50 border border-emerald-200 p-4">
        <p className="font-semibold text-emerald-800">Ты уже партнёр!</p>
        <Button className="mt-3" onClick={() => router.push(`/${locale}/partner/dashboard`)}>
          Перейти в кабинет партнёра
        </Button>
      </div>
    );
  }

  if (loadingApp) return <div className="text-zinc-500">Загрузка…</div>;

  const showStatus = application && application.status !== "REJECTED";
  const allowSubmit = !application || application.status === "REJECTED";

  const onSubmit = async (v: Out) => {
    setSubmitting(true); setError(null);
    try {
      const links = (v.socialLinks ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
      const fresh = await partnersApi.submit({
        motivation: v.motivation,
        socialLinks: links,
        audienceSize: v.audienceSize,
      });
      setApplication(fresh);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {application && (
        <div className={`rounded-md border p-4 ${STATUS_TEXT[application.status]!.cls}`}>
          <p className="font-semibold">{STATUS_TEXT[application.status]!.title}</p>
          <p className="text-sm mt-1">{STATUS_TEXT[application.status]!.descr}</p>
          {application.status === "REJECTED" && application.rejectReason && (
            <p className="text-sm mt-2 italic">Причина: {application.rejectReason}</p>
          )}
        </div>
      )}

      {!showStatus && allowSubmit && (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-zinc-200 p-6 flex flex-col gap-4">
          <div>
            <Label htmlFor="motivation">Расскажи о себе и почему ты хочешь стать партнёром</Label>
            <textarea
              id="motivation" rows={5} {...register("motivation")}
              placeholder="Например: я тревел-блогер, веду телеграм-канал на 50 000 подписчиков..."
              className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 mt-1"
            />
            {errors.motivation && <p className="mt-1 text-xs text-red-600">{errors.motivation.message}</p>}
          </div>

          <div>
            <Label htmlFor="socialLinks">Ссылки на соц-сети (по одной на строку)</Label>
            <textarea
              id="socialLinks" rows={3} {...register("socialLinks")}
              placeholder={"https://t.me/your_channel\nhttps://instagram.com/your_handle"}
              className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-mono shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 mt-1"
            />
          </div>

          <div>
            <Label htmlFor="audienceSize">Размер аудитории (опционально)</Label>
            <Input id="audienceSize" type="number" min={0} {...register("audienceSize")} placeholder="50000" />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
          )}

          <Button type="submit" disabled={submitting}>
            {submitting ? "Отправляем..." : "Подать заявку"}
          </Button>
        </form>
      )}
    </div>
  );
}

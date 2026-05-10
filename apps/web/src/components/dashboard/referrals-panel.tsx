"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Copy, Check, Send, MessageCircle, Share2 } from "lucide-react";
import { useLocale } from "next-intl";
import { referralsApi } from "@/src/shared/api/referrals-api";
import { Button } from "@/src/components/ui/button";

export function ReferralsPanel() {
  const locale = useLocale();
  const [copied, setCopied] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["referrals", "stats"],
    queryFn: () => referralsApi.stats(),
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const refLink = data ? `${appUrl}/${locale}/tours?ref=${data.referralCode}` : "";

  const onCopy = () => {
    if (!refLink) return;
    void navigator.clipboard.writeText(refLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareText = "Привет! Зацени туры на этом сайте, очень крутые предложения 🌍";

  if (isLoading) return <div className="text-zinc-500">Загрузка статистики…</div>;
  if (isError || !data) return <div className="text-red-600">Не удалось загрузить статистику.</div>;

  return (
    <div className="space-y-6">
      {/* Прогресс */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-blue-200 text-sm">Прогресс к бесплатному туру</p>
            <p className="text-3xl font-bold">{data.referralCount} / {data.threshold}</p>
          </div>
          {data.freeToursAvailable > 0 && (
            <span className="bg-amber-400 text-amber-900 font-semibold px-3 py-1 rounded-full text-sm">
              🎉 Доступно: {data.freeToursAvailable} бесплатный тур
            </span>
          )}
        </div>
        <div className="w-full bg-blue-900/40 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-300 to-amber-500 h-full transition-all duration-500"
            style={{ width: `${data.progressPercent}%` }}
          />
        </div>
        <p className="text-blue-100 text-sm mt-3">
          {data.remaining > 0
            ? `Осталось ${data.remaining} ${pluralize(data.remaining, "приглашение", "приглашения", "приглашений")} до бесплатного тура!`
            : "Поздравляем! Можете оформить бесплатный тур."}
        </p>
      </div>

      {/* Реф-ссылка */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h3 className="font-semibold text-zinc-900 mb-3">Твоя реферальная ссылка</h3>
        <div className="flex gap-2">
          <input
            type="text" readOnly value={refLink}
            className="flex-1 h-10 rounded-md border border-zinc-200 px-3 text-sm font-mono bg-zinc-50"
            onClick={(e) => e.currentTarget.select()}
          />
          <Button onClick={onCopy} variant={copied ? "default" : "outline"} className="shrink-0">
            {copied ? (<><Check className="w-4 h-4 mr-1" />Скопировано</>) : (<><Copy className="w-4 h-4 mr-1" />Скопировать</>)}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(shareText)}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-sky-500 text-white text-sm hover:bg-sky-600"
          >
            <Send className="w-4 h-4" /> Telegram
          </a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${refLink}`)}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-500 text-white text-sm hover:bg-emerald-600"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </a>
          <a
            href={`https://vk.com/share.php?url=${encodeURIComponent(refLink)}&title=${encodeURIComponent(shareText)}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-blue-700 text-white text-sm hover:bg-blue-800"
          >
            <Share2 className="w-4 h-4" /> VK
          </a>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Переходы" value={data.clicks} hint="всего кликов по ссылке" />
        <StatCard label="Регистрации" value={data.registrations} hint="зарегистрировались" />
        <StatCard label="Оплачено" value={data.paidBookings} hint="купили тур" />
        <StatCard label="Конверсия" value={`${data.conversionRate}%`} hint="клик → продажа" />
      </div>

      {data.pendingBookings > 0 && (
        <div className="rounded-md bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
          🔔 У вас {data.pendingBookings} {pluralize(data.pendingBookings, "заявка", "заявки", "заявок")} в работе у менеджера.
          Когда они будут оплачены, счётчик увеличится.
        </div>
      )}

      {data.role === "PARTNER" && (
        <div className="rounded-md bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
          💼 Вы партнёр! Подробная статистика и баланс — в <a href={`/${locale}/partner/dashboard`} className="font-semibold underline">кабинете партнёра</a>.
        </div>
      )}

      {data.role === "CLIENT" && (
        <div className="rounded-md bg-zinc-50 border border-zinc-200 p-4 text-sm text-zinc-700">
          Хочешь зарабатывать 5% с каждой продажи как блогер или агент?{" "}
          <a href={`/${locale}/become-partner`} className="font-semibold text-blue-600 underline">
            Подай заявку на партнёрство
          </a>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="text-2xl font-bold text-zinc-900 mt-1">{value}</p>
      {hint && <p className="text-xs text-zinc-400 mt-1">{hint}</p>}
    </div>
  );
}

function pluralize(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

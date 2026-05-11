"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Copy, Check, Send, MessageCircle, Share2, Gift,
  MousePointerClick, UserPlus, ShoppingBag, TrendingUp, Sparkles,
} from "lucide-react";
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-44 rounded-3xl tv-shimmer" />
        <div className="h-32 rounded-2xl tv-shimmer" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl tv-shimmer" />
          ))}
        </div>
      </div>
    );
  }
  if (isError || !data) {
    return <div className="text-rose-600">Не удалось загрузить статистику.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <header className="tv-hero p-7 md:p-9">
        <div className="flex flex-col md:flex-row md:items-end gap-6">
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
              <Sparkles className="h-3 w-3" /> Реферальная программа
            </div>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-white">
              Приглашай друзей — получай туры в подарок
            </h1>
            <p className="mt-2 text-white/85 max-w-2xl">
              {data.remaining > 0
                ? `Осталось ${data.remaining} ${pluralize(data.remaining, "приглашение", "приглашения", "приглашений")} до бесплатного тура!`
                : "🎉 Поздравляем! Можете оформить бесплатный тур."}
            </p>
          </div>

          {/* Progress ring-ish */}
          <div className="md:w-80 shrink-0">
            <div className="flex items-baseline justify-between text-white">
              <p className="text-xs uppercase tracking-[0.12em] text-white/70">Прогресс</p>
              <p className="text-2xl font-bold tabular-nums">
                {data.referralCount}
                <span className="text-white/60 text-base"> / {data.threshold}</span>
              </p>
            </div>
            <div className="mt-3 h-3 rounded-full bg-black/25 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500 transition-[width] duration-700"
                style={{ width: `${Math.min(100, data.progressPercent)}%` }}
              />
            </div>
            {data.freeToursAvailable > 0 && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-300/95 px-3 py-2 text-amber-950 text-sm font-semibold shadow-sm">
                <Gift className="h-4 w-4" />
                Доступно: {data.freeToursAvailable} бесплатный тур
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Переходы" value={data.clicks} hint="клики по ссылке"
          icon={MousePointerClick} tone="sky" />
        <StatTile label="Регистрации" value={data.registrations} hint="зарегистрировались"
          icon={UserPlus} tone="teal" />
        <StatTile label="Оплачено" value={data.paidBookings} hint="купили тур"
          icon={ShoppingBag} tone="emerald" />
        <StatTile label="Конверсия" value={`${data.conversionRate}%`} hint="клик → продажа"
          icon={TrendingUp} tone="amber" />
      </div>

      {/* Referral link */}
      <section className="tv-surface-elevated p-6 md:p-7">
        <h3 className="font-semibold text-slate-900 text-lg">Твоя реферальная ссылка</h3>
        <p className="text-sm text-slate-500 mt-0.5">
          Поделись ссылкой — мы сами посчитаем переходы, регистрации и продажи.
        </p>

        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            readOnly
            value={refLink}
            className="flex-1 h-11 rounded-xl border border-slate-200 px-3.5 text-sm font-mono bg-slate-50 text-slate-700 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 outline-none"
            onClick={(e) => e.currentTarget.select()}
          />
          <Button onClick={onCopy} variant={copied ? "default" : "outline"} className="shrink-0">
            {copied ? (<><Check className="w-4 h-4" />Скопировано</>) : (<><Copy className="w-4 h-4" />Скопировать</>)}
          </Button>
        </div>

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 mb-2">Поделиться</p>
          <div className="flex flex-wrap gap-2">
            <ShareLink
              href={`https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(shareText)}`}
              className="bg-[#229ED9] hover:bg-[#1f8fc5]"
              icon={<Send className="h-4 w-4" />}
              label="Telegram"
            />
            <ShareLink
              href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${refLink}`)}`}
              className="bg-[#25D366] hover:bg-[#21bd5b]"
              icon={<MessageCircle className="h-4 w-4" />}
              label="WhatsApp"
            />
            <ShareLink
              href={`https://vk.com/share.php?url=${encodeURIComponent(refLink)}&title=${encodeURIComponent(shareText)}`}
              className="bg-[#0077FF] hover:bg-[#006ae3]"
              icon={<Share2 className="h-4 w-4" />}
              label="VK"
            />
          </div>
        </div>
      </section>

      {/* Notices */}
      {data.pendingBookings > 0 && (
        <div className="flex items-start gap-3 rounded-2xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-900">
          <span className="grid place-items-center h-9 w-9 rounded-xl bg-amber-100 text-amber-700 shrink-0">
            <ShoppingBag className="h-4 w-4" />
          </span>
          <div>
            <p className="font-semibold">{data.pendingBookings} {pluralize(data.pendingBookings, "заявка", "заявки", "заявок")} в работе у менеджера</p>
            <p className="text-amber-700/90">Когда они будут оплачены, счётчик увеличится автоматически.</p>
          </div>
        </div>
      )}

      {data.role === "PARTNER" && (
        <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-900">
          <span className="grid place-items-center h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="font-semibold">Вы партнёр</p>
            <p className="text-emerald-700/90">
              Подробная статистика и баланс — в {" "}
              <a href={`/${locale}/partner/dashboard`} className="font-semibold underline underline-offset-2">кабинете партнёра</a>.
            </p>
          </div>
        </div>
      )}

      {data.role === "CLIENT" && (
        <div className="flex items-start gap-3 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700">
          <span className="grid place-items-center h-9 w-9 rounded-xl bg-slate-200 text-slate-700 shrink-0">
            <TrendingUp className="h-4 w-4" />
          </span>
          <div>
            <p className="font-semibold text-slate-900">Хотите зарабатывать 5% с каждой продажи?</p>
            <p>
              Подайте заявку — для блогеров и агентов.{" "}
              <a href={`/${locale}/become-partner`} className="font-semibold text-teal-700 underline underline-offset-2">
                Стать партнёром
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ShareLink({
  href, icon, label, className,
}: { href: string; icon: React.ReactNode; label: string; className: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-[0_4px_12px_-4px_rgba(15,23,42,0.25)] hover:-translate-y-0.5 transition-transform ${className}`}
    >
      {icon} {label}
    </a>
  );
}

function StatTile({
  label, value, hint, icon: Icon, tone,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: React.ElementType;
  tone: "teal" | "sky" | "emerald" | "amber" | "rose";
}) {
  const toneCls: Record<typeof tone, string> = {
    teal: "from-teal-500 to-teal-600 text-white",
    sky: "from-sky-500 to-sky-600 text-white",
    emerald: "from-emerald-500 to-emerald-600 text-white",
    amber: "from-amber-400 to-amber-500 text-amber-950",
    rose: "from-rose-500 to-rose-600 text-white",
  };
  return (
    <div className="tv-kpi">
      <div className="relative flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">{label}</span>
        <span className={`grid place-items-center h-8 w-8 rounded-lg bg-gradient-to-br ${toneCls[tone]} shadow-sm`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="relative mt-2 text-3xl font-bold tracking-tight text-slate-900 tabular-nums">{value}</p>
      {hint && <p className="relative text-xs text-slate-400 mt-1">{hint}</p>}
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

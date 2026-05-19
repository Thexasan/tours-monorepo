"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend,
} from "recharts";
import {
  TrendingUp, MousePointerClick, UserPlus, ShoppingBag, BarChart3, Activity,
  Copy, Check, Link2,
} from "lucide-react";
import { referralsApi } from "@/src/shared/api/referrals-api";

export function PartnerDashboard() {
  const locale = useLocale();
  const [copied, setCopied] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["partner", "stats"],
    queryFn: () => referralsApi.partnerStats(),
  });

  const appUrl = typeof window !== "undefined"
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_APP_URL ?? "");

  const refLink = data?.referralCode
    ? `${appUrl}/${locale}/tours?ref=${data.referralCode}`
    : "";

  const onCopy = () => {
    if (!refLink) return;
    void navigator.clipboard.writeText(refLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 rounded-2xl tv-shimmer" />)}
        </div>
        <div className="h-80 rounded-2xl tv-shimmer" />
        <div className="h-72 rounded-2xl tv-shimmer" />
      </div>
    );
  }
  if (isError || !data) return <div className="text-rose-600">Не удалось загрузить статистику.</div>;

  // Объединяем все три серии по дате для одного графика
  const allDays = new Set([
    ...data.timeline.clicks.map((d) => d.day),
    ...data.timeline.registrations.map((d) => d.day),
    ...data.timeline.sales.map((d) => d.day),
  ]);
  const sortedDays = Array.from(allDays).sort();
  const chartData = sortedDays.map((day) => ({
    day: day.slice(5),
    clicks: data.timeline.clicks.find((c) => c.day === day)?.count ?? 0,
    registrations: data.timeline.registrations.find((r) => r.day === day)?.count ?? 0,
    sales: data.timeline.sales.find((s) => s.day === day)?.count ?? 0,
  }));

  const revenueChart = data.timeline.sales.map((s) => ({
    day: s.day.slice(5),
    revenue: s.amount,
    commission: Number((s.amount * 0.05).toFixed(2)),
  }));

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <header className="tv-hero tv-hero-forest p-7 md:p-9">
        <div className="flex flex-col md:flex-row md:items-end gap-5">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-[0.16em] font-semibold text-white/80">
              Кабинет партнёра
            </p>
            <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight text-white">
              Ваша статистика за 30 дней
            </h1>
            <p className="mt-2 text-white/85 max-w-xl">
              Отслеживайте клики, регистрации и продажи — комиссия 5% с каждой оплаченной заявки.
            </p>
          </div>
          <div className="shrink-0 rounded-2xl bg-white/10 backdrop-blur px-5 py-4 ring-1 ring-white/15">
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/70">Доход всего</p>
            <p className="text-3xl font-bold tabular-nums mt-1 text-white">
              ${data.totals.totalCommission.toFixed(2)}
            </p>
            <p className="text-xs text-white/80 mt-0.5">
              с {data.totals.totalPaidBookings} продаж
            </p>
          </div>
        </div>
      </header>

      {/* Referral link card */}
      <section className="tv-surface-elevated p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div
          className="shrink-0 grid place-items-center h-11 w-11 rounded-xl"
          style={{ background: "linear-gradient(135deg, #f97316, #0891b2)" }}
        >
          <Link2 className="h-5 w-5 text-white" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">
            Ваша реферальная ссылка
          </p>
          <p className="font-mono text-sm text-slate-800 truncate select-all" title={refLink}>
            {refLink || "Загрузка…"}
          </p>
        </div>
        <button
          type="button"
          onClick={onCopy}
          disabled={!refLink}
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: copied ? "#d1fae5" : "#f0fdfa",
            color: copied ? "#065f46" : "#f97316",
            border: `1px solid ${copied ? "#6ee7b7" : "#99f6e4"}`,
          }}
        >
          {copied
            ? <><Check className="h-4 w-4" aria-hidden /> Скопировано</>
            : <><Copy className="h-4 w-4" aria-hidden /> Скопировать</>
          }
        </button>
      </section>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Клики" value={data.totals.totalClicks} icon={MousePointerClick} tone="sky" />
        <KPI label="Регистрации" value={data.totals.totalRegistrations} icon={UserPlus} tone="teal" />
        <KPI label="Продажи" value={data.totals.totalPaidBookings} icon={ShoppingBag} tone="emerald" />
        <KPI
          label="Доход"
          value={`$${data.totals.totalCommission.toFixed(2)}`}
          icon={TrendingUp}
          tone="amber"
          hint={`оборот $${data.totals.totalRevenue.toFixed(0)} · 5%`}
        />
      </div>

      {/* Activity chart */}
      <section className="tv-surface-elevated p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Activity className="h-4 w-4 text-orange-600" />
              Активность за 30 дней
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Клики, регистрации, продажи по дням</p>
          </div>
        </div>
        {chartData.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            Пока нет данных за последние 30 дней.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <defs>
                <linearGradient id="grad-clicks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  boxShadow: "0 10px 25px -10px rgba(15,23,42,0.15)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="clicks" name="Клики" stroke="#0284c7" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="registrations" name="Регистрации" stroke="#f97316" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="sales" name="Продажи" stroke="#059669" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* Revenue chart */}
      <section className="tv-surface-elevated p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-600" />
              Доход
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Оборот и ваша комиссия (5%) по дням</p>
          </div>
        </div>
        {revenueChart.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            Продаж пока нет.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(v: number) => `$${v}`}
                contentStyle={{
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  boxShadow: "0 10px 25px -10px rgba(15,23,42,0.15)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="revenue" name="Оборот" fill="#a7f3d0" radius={[6, 6, 0, 0]} />
              <Bar dataKey="commission" name="Ваша комиссия" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>
    </div>
  );
}

function KPI({
  label, value, icon: Icon, tone, hint,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  tone: "teal" | "sky" | "emerald" | "amber";
  hint?: string;
}) {
  const toneCls: Record<typeof tone, string> = {
    teal: "from-orange-500 to-orange-600",
    sky: "from-sky-500 to-sky-600",
    emerald: "from-emerald-500 to-emerald-600",
    amber: "from-amber-400 to-amber-500",
  };
  return (
    <div className="tv-kpi">
      <div className="relative flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">{label}</span>
        <span className={`grid place-items-center h-9 w-9 rounded-xl bg-linear-to-br ${toneCls[tone]} text-white shadow-sm`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="relative mt-3 text-3xl font-bold tracking-tight text-slate-900 tabular-nums">{value}</p>
      {hint && <p className="relative text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

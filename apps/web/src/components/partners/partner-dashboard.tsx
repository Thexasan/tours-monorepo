"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend,
} from "recharts";
import {
  TrendingUp, MousePointerClick, UserPlus, ShoppingBag, BarChart3, Activity,
  Copy, Check, Link2, Sparkles, Star, Award, ChevronRight,
} from "lucide-react";
import { referralsApi } from "@/src/shared/api/referrals-api";

export function PartnerDashboard() {
  const locale = useLocale();
  const t = useTranslations('dashboard');
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
        <div className="h-32 rounded-3xl tv-shimmer" />
        <div className="h-20 rounded-2xl tv-shimmer" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 rounded-2xl tv-shimmer" />)}
        </div>
        <div className="h-80 rounded-2xl tv-shimmer" />
        <div className="h-72 rounded-2xl tv-shimmer" />
      </div>
    );
  }
  if (isError || !data) return <div className="text-rose-600">{t('partner.dashboard.loadError')}</div>;

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
      {/* Premium Glass Hero header */}
      <header className="relative overflow-hidden tv-surface-elevated p-6 sm:p-8 md:p-9 flex flex-col md:flex-row md:items-center gap-6 rounded-3xl border border-white/50 shadow-md backdrop-blur-md bg-gradient-to-br from-white/95 to-slate-50/90">
        {/* Glowing spots */}
        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 rounded-full bg-teal-500/5 blur-3xl pointer-events-none" />
        {/* Subtle grid mesh background */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="flex-1 min-w-0 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 text-[10px] font-extrabold uppercase tracking-widest">
            <Award className="h-3.5 w-3.5 animate-pulse" />
            {t('partner.dashboard.sectionTitle')}
          </div>
          <h1 className="mt-3 text-3xl md:text-4xl font-black tracking-tight text-slate-800">
            {t('partner.dashboard.statsTitle')}
          </h1>
          <p className="mt-2 text-slate-500 text-sm font-semibold max-w-xl leading-relaxed">
            {t('partner.dashboard.statsSubtitle')}
          </p>
        </div>

        <div className="shrink-0 rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-900 px-6 py-4.5 border border-emerald-500/20 shadow-[0_12px_24px_-8px_rgba(16,185,129,0.3)] text-white relative overflow-hidden shrink-0 min-w-[200px] hover:scale-[1.02] transition-transform duration-300">
          {/* subtle interior flare */}
          <div className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute left-2 top-2 h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-200/90 leading-none">{t('partner.dashboard.totalIncome')}</p>
          <p className="text-3xl font-black tracking-tight mt-2 tabular-nums">
            ${data.totals.totalCommission.toFixed(2)}
          </p>
          <p className="text-xs text-emerald-100/90 mt-1 font-semibold">
            {t('partner.dashboard.fromSales', { count: data.totals.totalPaidBookings })}
          </p>
        </div>
      </header>

      {/* Luxury Referral link card */}
      <section className="relative overflow-hidden tv-surface-elevated p-5 flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-slate-100/80 shadow-sm bg-white hover:shadow-md transition-all duration-300">
        <div className="absolute -left-12 -top-12 w-28 h-28 rounded-full bg-gradient-to-br from-emerald-500/5 to-teal-500/5 blur-2xl pointer-events-none" />
        <div className="relative z-10 shrink-0 grid place-items-center h-12 w-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/10">
          <Link2 className="h-5.5 w-5.5" />
        </div>
        <div className="relative z-10 flex-1 min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1 leading-none">
            {t('partner.dashboard.refLinkTitle')}
          </p>
          <p className="font-mono text-xs font-bold text-slate-700 truncate select-all py-1 bg-slate-50/50 rounded px-2 mt-1 border border-slate-100 max-w-full inline-block" title={refLink}>
            {refLink || t('partner.dashboard.refLinkLoading')}
          </p>
        </div>
        <button
          type="button"
          onClick={onCopy}
          disabled={!refLink}
          className="relative z-10 shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white shrink-0 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_8px_16px_-6px_rgba(16,185,129,0.35)] hover:shadow-[0_10px_20px_-4px_rgba(16,185,129,0.45)] cursor-pointer"
          style={{
            background: copied
              ? "linear-gradient(135deg, #10b981, #059669)"
              : "linear-gradient(135deg, #059669, #0f766e)",
          }}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-emerald-100" />
              {t('partner.dashboard.copied')}
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 text-teal-100" />
              {t('partner.dashboard.copy')}
            </>
          )}
        </button>
      </section>

      {/* Beautiful KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label={t('partner.dashboard.clicks')} value={data.totals.totalClicks} icon={MousePointerClick} tone="sky" />
        <KPI label={t('partner.dashboard.registrations')} value={data.totals.totalRegistrations} icon={UserPlus} tone="teal" />
        <KPI label={t('partner.dashboard.sales')} value={data.totals.totalPaidBookings} icon={ShoppingBag} tone="emerald" />
        <KPI
          label={t('partner.dashboard.income')}
          value={`$${data.totals.totalCommission.toFixed(2)}`}
          icon={TrendingUp}
          tone="amber"
          hint={t('partner.dashboard.turnover', { value: data.totals.totalRevenue.toFixed(0) })}
        />
      </div>

      {/* Glassmorphic Activity chart */}
      <section className="relative overflow-hidden tv-surface-elevated p-6 rounded-3xl border border-slate-100/80 shadow-sm bg-white">
        <div className="absolute -right-20 -top-20 w-60 h-60 rounded-full bg-sky-500/[0.02] blur-3xl pointer-events-none" />
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div>
            <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
                <Activity className="h-4.5 w-4.5 animate-pulse" />
              </span>
              {t('partner.dashboard.activityTitle')}
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-1">{t('partner.dashboard.activitySubtitle')}</p>
          </div>
        </div>
        {chartData.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm font-semibold relative z-10">
            {t('partner.dashboard.noActivity')}
          </div>
        ) : (
          <div className="relative z-10 w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="grad-clicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="grad-registrations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="grad-sales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} dy={8} />
                <YAxis stroke="#94a3b8" fontSize={11} fontWeight={600} allowDecimals={false} tickLine={false} axisLine={false} dx={-8} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-3 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl text-white text-xs space-y-1.5 min-w-[140px]">
                          <p className="font-extrabold text-slate-300 border-b border-slate-800 pb-1 mb-1">{label}</p>
                          {payload.map((p, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-4 font-semibold">
                              <span className="flex items-center gap-1.5 text-slate-400">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.stroke }} />
                                {p.name}:
                              </span>
                              <span className="font-black text-slate-100 tabular-nums">{p.value}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 15 }} iconType="circle" iconSize={8} />
                <Line type="monotone" dataKey="clicks" name={t('partner.dashboard.clicks')} stroke="#0284c7" strokeWidth={3} dot={{ r: 1 }} activeDot={{ r: 5, strokeWidth: 0 }} />
                <Line type="monotone" dataKey="registrations" name={t('partner.dashboard.registrations')} stroke="#f97316" strokeWidth={3} dot={{ r: 1 }} activeDot={{ r: 5, strokeWidth: 0 }} />
                <Line type="monotone" dataKey="sales" name={t('partner.dashboard.sales')} stroke="#10b981" strokeWidth={3} dot={{ r: 1 }} activeDot={{ r: 5, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Glassmorphic Revenue chart */}
      <section className="relative overflow-hidden tv-surface-elevated p-6 rounded-3xl border border-slate-100/80 shadow-sm bg-white">
        <div className="absolute -left-20 -bottom-20 w-60 h-60 rounded-full bg-emerald-500/[0.02] blur-3xl pointer-events-none" />
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div>
            <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <BarChart3 className="h-4.5 w-4.5" />
              </span>
              {t('partner.dashboard.earningsTitle')}
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-1">{t('partner.dashboard.earningsSubtitle')}</p>
          </div>
        </div>
        {revenueChart.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm font-semibold relative z-10">
            {t('partner.dashboard.noSales')}
          </div>
        ) : (
          <div className="relative z-10 w-full h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChart} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="grad-rev-revenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6ee7b7" stopOpacity={0.85} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="grad-rev-commission" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.95} />
                    <stop offset="95%" stopColor="#047857" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} dy={8} />
                <YAxis stroke="#94a3b8" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} dx={-8} />
                <Tooltip
                  formatter={(v: number) => `$${v}`}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-3 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl text-white text-xs space-y-1.5 min-w-[140px]">
                          <p className="font-extrabold text-slate-300 border-b border-slate-800 pb-1 mb-1">{label}</p>
                          {payload.map((p, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-4 font-semibold">
                              <span className="flex items-center gap-1.5 text-slate-400">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.fill === "url(#grad-rev-revenue)" ? "#6ee7b7" : "#059669" }} />
                                {p.name}:
                              </span>
                              <span className="font-black text-slate-100 tabular-nums">${p.value}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 15 }} iconType="circle" iconSize={8} />
                <Bar dataKey="revenue" name={t('partner.dashboard.totalTurnover')} fill="url(#grad-rev-revenue)" radius={[6, 6, 0, 0]} barSize={16} />
                <Bar dataKey="commission" name={t('partner.dashboard.yourCommission')} fill="url(#grad-rev-commission)" radius={[6, 6, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
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
    teal: "from-teal-500 to-emerald-600 shadow-teal-500/20",
    sky: "from-sky-500 to-blue-600 shadow-sky-500/20",
    emerald: "from-emerald-500 to-green-600 shadow-emerald-500/20",
    amber: "from-amber-400 to-yellow-500 shadow-amber-400/20",
  };
  return (
    <div className="relative overflow-hidden tv-surface-elevated p-5 rounded-2xl border border-slate-100/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 bg-white">
      {/* Background soft glow */}
      <div className="absolute -right-8 -bottom-8 w-20 h-20 rounded-full bg-slate-500/[0.02] blur-xl pointer-events-none" />
      
      <div className="relative flex items-center justify-between">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{label}</span>
        <span className={`grid place-items-center h-10 w-10 rounded-xl bg-gradient-to-br ${toneCls[tone]} text-white shadow-lg`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="relative mt-4 text-3xl font-black tracking-tight text-slate-800 tabular-nums">{value}</p>
      {hint && <p className="relative text-[10px] font-bold text-slate-400/80 mt-1.5 leading-normal">{hint}</p>}
    </div>
  );
}

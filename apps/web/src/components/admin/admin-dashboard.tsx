"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import {
  Mail, Wallet, Briefcase, MessageSquare,
  TrendingUp, Clock, CheckCircle2,
  ArrowRight, Activity, AlertCircle, DollarSign, Sparkles, Users
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { bookingsApi } from "@/src/shared/api/bookings-api";
import { adminToursApi } from "@/src/shared/api/admin-tours-api";
import { payoutsApi } from "@/src/shared/api/payouts-api";
import type { BookingStatus } from "@tours/types";

const STATUS_COLORS: Record<BookingStatus, { text: string; bg: string; dot: string; bar: string }> = {
  NEW:                 { text: "text-sky-600",      bg: "bg-sky-50/60 ring-sky-500/20",      dot: "bg-sky-500",      bar: "bg-sky-500" },
  IN_PROGRESS:         { text: "text-amber-600",    bg: "bg-amber-50/60 ring-amber-500/20",    dot: "bg-amber-500",    bar: "bg-amber-500" },
  AWAITING_PAYMENT:    { text: "text-sky-600",      bg: "bg-sky-50/60 ring-sky-500/20",      dot: "bg-sky-500",      bar: "bg-sky-500" },
  PAID:                { text: "text-emerald-600",  bg: "bg-emerald-50/60 ring-emerald-500/20",  dot: "bg-emerald-500",  bar: "bg-emerald-500" },
  COMPLETED:           { text: "text-slate-600",    bg: "bg-slate-100/60 ring-slate-400/20",    dot: "bg-slate-400",    bar: "bg-slate-400" },
  CANCELLED:           { text: "text-rose-600",     bg: "bg-rose-50/60 ring-rose-500/20",     dot: "bg-rose-500",     bar: "bg-rose-500" },
  DOCUMENTS_REQUESTED: { text: "text-violet-600",   bg: "bg-violet-50/60 ring-violet-500/20",   dot: "bg-violet-500",   bar: "bg-violet-500" },
  DOCUMENTS_SUBMITTED: { text: "text-teal-600",     bg: "bg-teal-50/60 ring-teal-500/20",     dot: "bg-teal-500",     bar: "bg-teal-500" },
};


const CustomTooltip = ({ active, payload, revenueLabel, bookingsLabel }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0f172a] border border-slate-800 p-3.5 rounded-xl shadow-xl text-white text-xs select-none">
        <p className="font-semibold text-slate-300 mb-1.5">{payload[0].payload.month}</p>
        <div className="space-y-1 font-mono">
          <p className="flex items-center justify-between gap-5 text-teal-400">
            <span>{revenueLabel}</span>
            <span className="font-bold">${payload[0].payload.revenue.toLocaleString()}</span>
          </p>
          <p className="flex items-center justify-between gap-5 text-sky-400">
            <span>{bookingsLabel}</span>
            <span className="font-bold">{payload[0].payload.bookings}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function AdminDashboard() {
  const locale = useLocale();
  const t = useTranslations('dashboard');

  const STATUS_LABELS: Record<BookingStatus, string> = {
    NEW: t('admin.status.NEW'),
    IN_PROGRESS: t('admin.status.IN_PROGRESS'),
    AWAITING_PAYMENT: t('admin.status.AWAITING_PAYMENT'),
    PAID: t('admin.status.PAID'),
    COMPLETED: t('admin.status.COMPLETED'),
    CANCELLED: t('admin.status.CANCELLED'),
    DOCUMENTS_REQUESTED: t('admin.status.DOCUMENTS_REQUESTED'),
    DOCUMENTS_SUBMITTED: t('admin.status.DOCUMENTS_SUBMITTED'),
  };

  const { data: allBookings, isLoading: loadingBookings } = useQuery({
    queryKey: ["admin", "bookings", "all", "dashboard"],
    queryFn: () => bookingsApi.listAll({ pageSize: 100 }),
    staleTime: 30_000,
  });

  const { data: tours, isLoading: loadingTours } = useQuery({
    queryKey: ["admin", "tours"],
    queryFn: () => adminToursApi.list(true),
    staleTime: 60_000,
  });

  const { data: payouts, isLoading: loadingPayouts } = useQuery({
    queryKey: ["admin", "payouts", "all"],
    queryFn: () => payoutsApi.listAll("REQUESTED"),
    staleTime: 30_000,
  });

  const bookings = allBookings?.items ?? [];
  const totalBookings = allBookings?.total ?? 0;
  const activeTours = (tours ?? []).filter((t) => t.isActive).length;
  const pendingPayouts = (payouts ?? []).filter((p) => p.status === "REQUESTED").length;

  const byStatus = bookings.reduce<Partial<Record<BookingStatus, number>>>((acc, b) => {
    acc[b.status] = (acc[b.status] ?? 0) + 1;
    return acc;
  }, {});

  const revenue = bookings
    .filter((b) => b.status === "PAID" || b.status === "COMPLETED")
    .reduce((sum, b) => sum + Number(b.totalPriceUsd ?? 0), 0);

  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const needsAttention = bookings.filter((b) =>
    b.status === "NEW" || b.status === "DOCUMENTS_SUBMITTED" || b.status === "AWAITING_PAYMENT"
  ).length;

  // Process chart data chronologically for last 6 months
  const chartData = React.useMemo(() => {
    if (!bookings.length) return [];
    const monthlyData: Record<string, { month: string; bookings: number; revenue: number }> = {};
    
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().substring(0, 7); // "YYYY-MM"
      const label = d.toLocaleDateString(locale, { month: "short" });
      monthlyData[key] = { month: label, bookings: 0, revenue: 0 };
    }

    bookings.forEach((b) => {
      const bDate = new Date(b.createdAt);
      const key = bDate.toISOString().substring(0, 7);
      if (monthlyData[key]) {
        monthlyData[key].bookings += 1;
        if (b.status === "PAID" || b.status === "COMPLETED") {
          monthlyData[key].revenue += Number(b.totalPriceUsd ?? 0);
        }
      }
    });

    return Object.values(monthlyData);
  }, [bookings]);

  return (
    <div className="space-y-7 animate-fade-in-up">

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label={t('admin.dashboard.statBookings')}
          value={loadingBookings ? "—" : String(totalBookings)}
          icon={Mail}
          color="rose"
          href={`/${locale}/admin/bookings`}
          sub={t('admin.dashboard.statBookingsSub')}
        />
        <StatCard
          label={t('admin.dashboard.statRevenue')}
          value={loadingBookings ? "—" : `$${revenue.toLocaleString(locale)}`}
          icon={DollarSign}
          color="emerald"
          sub={t('admin.dashboard.statRevenueSub')}
        />
        <StatCard
          label={t('admin.dashboard.statTours')}
          value={loadingTours ? "—" : String(activeTours)}
          icon={Briefcase}
          color="amber"
          href={`/${locale}/admin/tours`}
          sub={t('admin.dashboard.statToursSub')}
        />
        <StatCard
          label={t('admin.dashboard.statPayouts')}
          value={loadingPayouts ? "—" : String(pendingPayouts)}
          icon={Wallet}
          color={pendingPayouts > 0 ? "indigo" : "slate"}
          href={`/${locale}/admin/payouts`}
          sub={t('admin.dashboard.statPayoutsSub')}
        />
      </div>

      {/* Attention Warning */}
      {needsAttention > 0 && (
        <div className="relative overflow-hidden p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70 shadow-sm flex items-start gap-4 animate-pulse-subtle">
          <div className="absolute top-0 right-0 p-6 opacity-5 select-none pointer-events-none">
            <Sparkles className="h-24 w-24 text-amber-600" />
          </div>
          <div className="grid place-items-center h-10 w-10 rounded-xl bg-amber-100 text-amber-700 shrink-0">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-amber-900 text-sm leading-snug">
              {t('admin.dashboard.attentionTitle', { count: needsAttention })}
            </p>
            <p className="text-xs text-amber-700 mt-1">
              {t('admin.dashboard.attentionDesc')}
            </p>
          </div>
          <Link
            href={`/${locale}/admin/bookings`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-800 hover:bg-amber-500/20 transition-all font-semibold text-xs shrink-0 self-center border border-amber-500/15"
          >
            {t('admin.dashboard.process')} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Analytics chart */}
      <div className="tv-surface-elevated p-6 bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-4.5 w-4.5 text-emerald-600" />
              {t('admin.dashboard.analyticsTitle')}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{t('admin.dashboard.analyticsSubtitle')}</p>
          </div>
          
          <div className="flex gap-4 text-xs font-semibold select-none bg-slate-50 border border-slate-200/50 p-1 rounded-xl">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200/50 shadow-xs text-slate-800">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
              {t('admin.dashboard.revenueLabel')}
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
              {t('admin.dashboard.bookingsLabel')}
            </span>
          </div>
        </div>

        <div className="h-[280px] w-full">
          {loadingBookings ? (
            <div className="h-full w-full rounded-2xl bg-slate-50 animate-pulse border border-slate-100 flex items-center justify-center text-xs text-slate-400">
              {t('admin.dashboard.buildingChart')}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#047857" stopOpacity={0.18}/>
                    <stop offset="95%" stopColor="#047857" stopOpacity={0.01}/>
                  </linearGradient>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.12}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip revenueLabel={t('admin.dashboard.tooltipRevenue')} bookingsLabel={t('admin.dashboard.tooltipBookings')} />} />
                <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#047857" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area yAxisId="right" type="monotone" dataKey="bookings" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#colorBookings)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Recent bookings list */}
        <div className="tv-surface-elevated p-6 bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="h-4.5 w-4.5 text-emerald-600" />
              {t('admin.dashboard.recentTitle')}
            </h2>
            <Link
              href={`/${locale}/admin/bookings`}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100/60 px-3 py-1.5 rounded-xl border border-emerald-100/40 transition-colors"
            >
              {t('admin.dashboard.allBookings')} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loadingBookings ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-50 animate-pulse border border-slate-100" />
              ))}
            </div>
          ) : recentBookings.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-12">{t('admin.dashboard.noBookings')}</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentBookings.map((b) => {
                const s = STATUS_COLORS[b.status] ?? { text: "text-slate-600", bg: "bg-slate-50", dot: "bg-slate-400", bar: "bg-slate-400" };
                return (
                  <Link
                    key={b.id}
                    href={`/${locale}/admin/bookings/${b.id}`}
                    className="flex items-center gap-4 py-3.5 hover:bg-slate-50/50 transition-colors group first:pt-0 last:pb-0"
                  >
                    <div className="grid place-items-center h-10 w-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200/50 group-hover:scale-105 group-hover:from-emerald-50/50 group-hover:to-emerald-50 group-hover:border-emerald-200/30 transition-all shrink-0">
                      <Mail className="h-4.5 w-4.5 text-slate-500 group-hover:text-emerald-700 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate group-hover:text-emerald-700 transition-colors leading-tight">
                        {b.contactName}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 truncate">
                        {b.contactEmail} · {new Date(b.createdAt).toLocaleDateString(locale)}
                      </p>
                    </div>
                    
                    <div className="text-right shrink-0">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ring-1 ${s.bg}`}>
                        <span className={`h-1 w-1 rounded-full ${s.dot} animate-pulse-subtle`} />
                        {STATUS_LABELS[b.status] ?? b.status}
                      </span>
                      <p className="text-xs font-bold text-slate-900 tabular-nums mt-1 font-mono">${b.totalPriceUsd}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Breakdown & Quick actions */}
        <div className="space-y-6">
          {/* Status distribution breakdown */}
          <div className="tv-surface-elevated p-6 bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
              <TrendingUp className="h-4.5 w-4.5 text-indigo-500" />
              {t('admin.dashboard.statusTitle')}
            </h2>
            
            {loadingBookings ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 rounded-xl bg-slate-50 animate-pulse border border-slate-100" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {(Object.keys(STATUS_LABELS) as BookingStatus[]).map((s) => {
                  const count = byStatus[s] ?? 0;
                  if (count === 0) return null;
                  const c = STATUS_COLORS[s];
                  const percentage = totalBookings > 0 ? (count / totalBookings) * 100 : 0;
                  return (
                    <div key={s} className="group py-1 select-none">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 leading-snug">
                        <span className="text-slate-600 hover:text-slate-800 transition-colors flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                          {STATUS_LABELS[s]}
                        </span>
                        <span className="font-mono text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/30">
                          {count}
                        </span>
                      </div>
                      
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2 border border-slate-200/20">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${c.bar}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions Panel */}
          <div className="tv-surface-elevated p-6 bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="h-4.5 w-4.5 text-slate-500" />
              {t('admin.dashboard.quickTitle')}
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { href: `/${locale}/admin/bookings`, icon: Mail, label: t('admin.dashboard.quickBookings'), border: "hover:border-emerald-300/40", hover: "hover:bg-emerald-50/50 hover:text-emerald-700" },
                { href: `/${locale}/admin/tours`, icon: Briefcase, label: t('admin.dashboard.quickTours'), border: "hover:border-emerald-300/40", hover: "hover:bg-emerald-50/50 hover:text-emerald-700" },
                { href: `/${locale}/admin/moderation`, icon: MessageSquare, label: t('admin.dashboard.quickModeration'), border: "hover:border-emerald-300/40", hover: "hover:bg-emerald-50/50 hover:text-emerald-700" },
                { href: `/${locale}/admin/payouts`, icon: Wallet, label: t('admin.dashboard.quickPayouts'), border: "hover:border-emerald-300/40", hover: "hover:bg-emerald-50/50 hover:text-emerald-700" },
                { href: `/${locale}/admin/users`, icon: Users, label: t('admin.dashboard.quickUsers'), border: "hover:border-emerald-300/40", hover: "hover:bg-emerald-50/50 hover:text-emerald-700" },
                { href: `/${locale}/admin/partners`, icon: CheckCircle2, label: t('admin.dashboard.quickPartners'), border: "hover:border-emerald-300/40", hover: "hover:bg-emerald-50/50 hover:text-emerald-700" },
              ].map(({ href, icon: Icon, label, hover, border }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-slate-200 text-slate-600 text-[11px] font-bold transition-all hover:scale-103 duration-150 shadow-2xs ${hover} ${border}`}
                >
                  <span className="grid place-items-center h-8 w-8 rounded-xl bg-white border border-slate-100 shadow-3xs group-hover:scale-105 transition-transform">
                    <Icon className="h-4 w-4" />
                  </span>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label, value, icon: Icon, color, href, sub,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: "rose" | "emerald" | "amber" | "indigo" | "slate";
  href?: string;
  sub?: string;
}) {
  const colors = {
    rose:    { border: "hover:border-rose-300/40",    grad: "from-rose-500 to-rose-600",       shadow: "shadow-rose-500/10 bg-rose-50 text-rose-700" },
    emerald: { border: "hover:border-emerald-400/40", grad: "from-emerald-600 to-emerald-700", shadow: "shadow-emerald-600/10 bg-emerald-100 text-emerald-800" },
    amber:   { border: "hover:border-amber-300/40",   grad: "from-amber-500 to-amber-600",     shadow: "shadow-amber-500/10 bg-amber-50 text-amber-700" },
    indigo:  { border: "hover:border-indigo-300/40",  grad: "from-indigo-500 to-indigo-600",  shadow: "shadow-indigo-500/25 bg-indigo-50 text-indigo-700" },
    slate:   { border: "hover:border-slate-300/40",   grad: "from-slate-500 to-slate-600",   shadow: "shadow-slate-500/10 bg-slate-50 text-slate-600" },
  };
  const c = colors[color];

  const inner = (
    <div className={`tv-surface-elevated p-5 flex items-start gap-4 h-full bg-white border border-slate-200/60 hover:shadow-md duration-300 select-none transition-all ${c.border}`}>
      <div className={`grid place-items-center h-12 w-12 rounded-2xl shrink-0 font-bold ${c.shadow}`}>
        <Icon className="h-5.5 w-5.5" />
      </div>
      
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] truncate leading-none mb-1.5">{label}</p>
        <p className="text-3xl font-extrabold text-slate-900 tabular-nums leading-none tracking-tight">{value}</p>
        {sub && <p className="text-[10px] text-slate-400 mt-2 font-medium bg-slate-50 border border-slate-200/30 rounded px-1.5 py-0.5 inline-block leading-tight">{sub}</p>}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block hover:-translate-y-1 transition-all duration-300">
        {inner}
      </Link>
    );
  }
  return inner;
}

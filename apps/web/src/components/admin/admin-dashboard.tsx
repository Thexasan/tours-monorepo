"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
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
  DOCUMENTS_SUBMITTED: { text: "text-orange-600",   bg: "bg-orange-50/60 ring-orange-500/20",   dot: "bg-orange-500",   bar: "bg-orange-500" },
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  NEW: "Новые",
  IN_PROGRESS: "В работе",
  AWAITING_PAYMENT: "Ждут оплаты",
  PAID: "Оплачены",
  COMPLETED: "Завершены",
  CANCELLED: "Отменены",
  DOCUMENTS_REQUESTED: "Ждут документы",
  DOCUMENTS_SUBMITTED: "Документы загружены",
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0f172a] border border-slate-800 p-3.5 rounded-xl shadow-xl text-white text-xs select-none">
        <p className="font-semibold text-slate-300 mb-1.5">{payload[0].payload.month}</p>
        <div className="space-y-1 font-mono">
          <p className="flex items-center justify-between gap-5 text-orange-400">
            <span>Выручка:</span>
            <span className="font-bold">${payload[0].payload.revenue.toLocaleString("ru-RU")}</span>
          </p>
          <p className="flex items-center justify-between gap-5 text-sky-400">
            <span>Заявки:</span>
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
      const label = d.toLocaleDateString("ru-RU", { month: "short" });
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
          label="Всего заявок"
          value={loadingBookings ? "—" : String(totalBookings)}
          icon={Mail}
          color="rose"
          href={`/${locale}/admin/bookings`}
          sub="полный список броней"
        />
        <StatCard
          label="Общая Выручка"
          value={loadingBookings ? "—" : `$${revenue.toLocaleString("ru-RU")}`}
          icon={DollarSign}
          color="emerald"
          sub="оплаченные + завершённые"
        />
        <StatCard
          label="Активные туры"
          value={loadingTours ? "—" : String(activeTours)}
          icon={Briefcase}
          color="amber"
          href={`/${locale}/admin/tours`}
          sub="опубликовано на сайте"
        />
        <StatCard
          label="Запросы выплат"
          value={loadingPayouts ? "—" : String(pendingPayouts)}
          icon={Wallet}
          color={pendingPayouts > 0 ? "indigo" : "slate"}
          href={`/${locale}/admin/payouts`}
          sub="ожидают обработки"
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
              Внимание: {needsAttention} {needsAttention === 1 ? "заявка требует" : (needsAttention < 5 ? "заявки требуют" : "заявок требуют")} рассмотрения
            </p>
            <p className="text-xs text-amber-700 mt-1">
              У вас есть необработанные новые заявки, прикреплённые гостевые документы или брони, ожидающие оплаты.
            </p>
          </div>
          <Link
            href={`/${locale}/admin/bookings`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-800 hover:bg-amber-500/20 transition-all font-semibold text-xs shrink-0 self-center border border-amber-500/15"
          >
            Обработать <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Analytics chart */}
      <div className="tv-surface-elevated p-6 bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-4.5 w-4.5 text-orange-500" />
              Аналитика продаж
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Динамика выручки и заявок за последние 6 месяцев</p>
          </div>
          
          <div className="flex gap-4 text-xs font-semibold select-none bg-slate-50 border border-slate-200/50 p-1 rounded-xl">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200/50 shadow-xs text-slate-800">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
              Выручка ($)
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
              Заявки (шт.)
            </span>
          </div>
        </div>

        <div className="h-[280px] w-full">
          {loadingBookings ? (
            <div className="h-full w-full rounded-2xl bg-slate-50 animate-pulse border border-slate-100 flex items-center justify-center text-xs text-slate-400">
              Строим график аналитики...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.18}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.01}/>
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
                <Tooltip content={<CustomTooltip />} />
                <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#ea580c" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
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
              <Activity className="h-4.5 w-4.5 text-rose-500" />
              Последние бронирования
            </h2>
            <Link
              href={`/${locale}/admin/bookings`}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 bg-rose-50 hover:bg-rose-100/60 px-3 py-1.5 rounded-xl border border-rose-100/40 transition-colors"
            >
              Все заявки <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loadingBookings ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-50 animate-pulse border border-slate-100" />
              ))}
            </div>
          ) : recentBookings.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-12">Новых бронирований пока нет</p>
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
                    <div className="grid place-items-center h-10 w-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200/50 group-hover:scale-105 group-hover:from-orange-50 group-hover:to-rose-50 group-hover:border-orange-200/30 transition-all shrink-0">
                      <Mail className="h-4.5 w-4.5 text-slate-500 group-hover:text-orange-600 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate group-hover:text-orange-600 transition-colors leading-tight">
                        {b.contactName}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 truncate">
                        {b.contactEmail} · {new Date(b.createdAt).toLocaleDateString("ru-RU")}
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
              Распределение по статусам
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
              Быстрые действия
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { href: `/${locale}/admin/bookings`, icon: Mail, label: "Заявки", border: "hover:border-rose-300/40", hover: "hover:bg-rose-50/50 hover:text-rose-700" },
                { href: `/${locale}/admin/tours`, icon: Briefcase, label: "Туры", border: "hover:border-orange-300/40", hover: "hover:bg-orange-50/50 hover:text-orange-700" },
                { href: `/${locale}/admin/moderation`, icon: MessageSquare, label: "Модерация", border: "hover:border-violet-300/40", hover: "hover:bg-violet-50/50 hover:text-violet-700" },
                { href: `/${locale}/admin/payouts`, icon: Wallet, label: "Выплаты", border: "hover:border-amber-300/40", hover: "hover:bg-amber-50/50 hover:text-amber-700" },
                { href: `/${locale}/admin/users`, icon: Users, label: "Юзеры", border: "hover:border-sky-300/40", hover: "hover:bg-sky-50/50 hover:text-sky-700" },
                { href: `/${locale}/admin/partners`, icon: CheckCircle2, label: "Партнёры", border: "hover:border-emerald-300/40", hover: "hover:bg-emerald-50/50 hover:text-emerald-700" },
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
    rose:    { border: "hover:border-rose-300/60",    grad: "from-rose-500 to-rose-600",    shadow: "shadow-rose-500/25 bg-rose-500/10 text-rose-600" },
    emerald: { border: "hover:border-emerald-300/60", grad: "from-emerald-500 to-emerald-600", shadow: "shadow-emerald-500/25 bg-emerald-500/10 text-emerald-600" },
    amber:   { border: "hover:border-amber-300/60",   grad: "from-orange-500 to-amber-500",   shadow: "shadow-orange-500/25 bg-orange-500/10 text-orange-600" },
    indigo:  { border: "hover:border-indigo-300/60",  grad: "from-indigo-500 to-indigo-600",  shadow: "shadow-indigo-500/25 bg-indigo-500/10 text-indigo-600" },
    slate:   { border: "hover:border-slate-300/60",   grad: "from-slate-500 to-slate-600",   shadow: "shadow-slate-500/25 bg-slate-500/10 text-slate-600" },
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

"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend,
} from "recharts";
import { TrendingUp, MousePointerClick, UserPlus, ShoppingBag } from "lucide-react";
import { referralsApi } from "@/src/shared/api/referrals-api";

export function PartnerDashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["partner", "stats"],
    queryFn: () => referralsApi.partnerStats(),
  });

  if (isLoading) return <div className="text-zinc-500">Загрузка…</div>;
  if (isError || !data) return <div className="text-red-600">Не удалось загрузить статистику.</div>;

  // Объединяем все три серии по дате для одного графика
  const allDays = new Set([
    ...data.timeline.clicks.map((d) => d.day),
    ...data.timeline.registrations.map((d) => d.day),
    ...data.timeline.sales.map((d) => d.day),
  ]);
  const sortedDays = Array.from(allDays).sort();
  const chartData = sortedDays.map((day) => ({
    day: day.slice(5), // MM-DD
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Клики" value={data.totals.totalClicks} icon={MousePointerClick} color="text-sky-600 bg-sky-50" />
        <KPI label="Регистрации" value={data.totals.totalRegistrations} icon={UserPlus} color="text-blue-600 bg-blue-50" />
        <KPI label="Продажи" value={data.totals.totalPaidBookings} icon={ShoppingBag} color="text-emerald-600 bg-emerald-50" />
        <KPI label="Доход" value={`$${data.totals.totalCommission.toFixed(2)}`} icon={TrendingUp} color="text-amber-600 bg-amber-50" hint={`${data.totals.totalRevenue.toFixed(0)} оборот · 5%`} />
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h3 className="font-semibold text-zinc-900 mb-4">Активность за 30 дней</h3>
        {chartData.length === 0 ? (
          <p className="text-zinc-500 text-sm">Пока нет данных за последние 30 дней.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="day" stroke="#71717a" fontSize={12} />
              <YAxis stroke="#71717a" fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="clicks" name="Клики" stroke="#0ea5e9" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="registrations" name="Регистрации" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="sales" name="Продажи" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h3 className="font-semibold text-zinc-900 mb-4">Доход (5% комиссия)</h3>
        {revenueChart.length === 0 ? (
          <p className="text-zinc-500 text-sm">Продаж пока нет.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={revenueChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="day" stroke="#71717a" fontSize={12} />
              <YAxis stroke="#71717a" fontSize={12} />
              <Tooltip formatter={(v: number) => `$${v}`} />
              <Legend />
              <Bar dataKey="revenue" name="Оборот" fill="#a7f3d0" />
              <Bar dataKey="commission" name="Ваша комиссия" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function KPI({
  label, value, icon: Icon, color, hint,
}: {
  label: string; value: number | string; icon: React.ElementType; color: string; hint?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-zinc-500">{label}</span>
        <span className={`p-2 rounded-md ${color}`}>
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <p className="text-2xl font-bold text-zinc-900">{value}</p>
      {hint && <p className="text-xs text-zinc-400 mt-1">{hint}</p>}
    </div>
  );
}

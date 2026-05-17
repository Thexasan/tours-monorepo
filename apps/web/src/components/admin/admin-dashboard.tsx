"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import {
  Mail, Users, Wallet, Briefcase, MessageSquare,
  TrendingUp, Clock, CheckCircle2, XCircle,
  ArrowRight, Activity, AlertCircle, DollarSign,
} from "lucide-react";
import { bookingsApi } from "@/src/shared/api/bookings-api";
import { adminToursApi } from "@/src/shared/api/admin-tours-api";
import { payoutsApi } from "@/src/shared/api/payouts-api";
import type { BookingStatus } from "@tours/types";

const STATUS_COLORS: Partial<Record<BookingStatus, string>> = {
  NEW: "text-sky-600",
  IN_PROGRESS: "text-amber-600",
  AWAITING_PAYMENT: "text-sky-600",
  PAID: "text-emerald-600",
  COMPLETED: "text-slate-600",
  CANCELLED: "text-rose-600",
  DOCUMENTS_REQUESTED: "text-violet-600",
  DOCUMENTS_SUBMITTED: "text-orange-600",
};

const STATUS_LABELS: Partial<Record<BookingStatus, string>> = {
  NEW: "Новые",
  IN_PROGRESS: "В работе",
  AWAITING_PAYMENT: "Ждут оплаты",
  PAID: "Оплачены",
  COMPLETED: "Завершены",
  CANCELLED: "Отменены",
  DOCUMENTS_REQUESTED: "Ждут документы",
  DOCUMENTS_SUBMITTED: "Документы загружены",
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
    .slice(0, 6);

  const needsAttention = bookings.filter((b) =>
    b.status === "NEW" || b.status === "DOCUMENTS_SUBMITTED" || b.status === "AWAITING_PAYMENT"
  ).length;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Всего заявок"
          value={loadingBookings ? "—" : String(totalBookings)}
          icon={Mail}
          color="rose"
          href={`/${locale}/admin/bookings`}
          sub="все заявки"
        />
        <StatCard
          label="Доход"
          value={loadingBookings ? "—" : `$${revenue.toLocaleString("ru-RU")}`}
          icon={DollarSign}
          color="emerald"
          sub="оплачено + завершено"
        />
        <StatCard
          label="Активные туры"
          value={loadingTours ? "—" : String(activeTours)}
          icon={Briefcase}
          color="teal"
          href={`/${locale}/admin/tours`}
          sub="в каталоге"
        />
        <StatCard
          label="Запросы выплат"
          value={loadingPayouts ? "—" : String(pendingPayouts)}
          icon={Wallet}
          color={pendingPayouts > 0 ? "amber" : "slate"}
          href={`/${locale}/admin/payouts`}
          sub="ожидают обработки"
        />
      </div>

      {needsAttention > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-amber-900 text-sm">
              {needsAttention} заявк{needsAttention === 1 ? "а требует" : (needsAttention < 5 ? "и требуют" : " требуют")} внимания
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Новые заявки, загруженные документы или ожидающие оплаты
            </p>
          </div>
          <Link
            href={`/${locale}/admin/bookings`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900 shrink-0"
          >
            Открыть <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        {/* Recent bookings */}
        <div className="tv-surface-elevated p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Activity className="h-4 w-4 text-rose-600" />
              Последние заявки
            </h2>
            <Link
              href={`/${locale}/admin/bookings`}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              Все заявки <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loadingBookings ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : recentBookings.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">Заявок пока нет</p>
          ) : (
            <div className="space-y-2">
              {recentBookings.map((b) => {
                const statusColor = STATUS_COLORS[b.status] ?? "text-slate-600";
                const statusLabel = STATUS_LABELS[b.status] ?? b.status;
                return (
                  <Link
                    key={b.id}
                    href={`/${locale}/admin/bookings/${b.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <div className="grid place-items-center h-9 w-9 rounded-xl bg-rose-50 shrink-0">
                      <Mail className="h-4 w-4 text-rose-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-rose-700 transition-colors">
                        {b.contactName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {b.contactEmail} · {new Date(b.createdAt).toLocaleDateString("ru-RU")}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xs font-semibold ${statusColor}`}>{statusLabel}</p>
                      <p className="text-xs text-slate-500 tabular-nums">${b.totalPriceUsd}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* By status + Quick links */}
        <div className="space-y-4">
          {/* Status breakdown */}
          <div className="tv-surface-elevated p-5">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-teal-600" />
              По статусам
            </h2>
            {loadingBookings ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-8 rounded-lg bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                {(Object.keys(STATUS_LABELS) as BookingStatus[]).map((s) => {
                  const count = byStatus[s] ?? 0;
                  if (count === 0) return null;
                  const color = STATUS_COLORS[s] ?? "text-slate-600";
                  return (
                    <Link
                      key={s}
                      href={`/${locale}/admin/bookings`}
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <span className="text-sm text-slate-700">{STATUS_LABELS[s]}</span>
                      <span className={`text-sm font-bold tabular-nums ${color}`}>{count}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="tv-surface-elevated p-5">
            <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-500" />
              Быстрые действия
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: `/${locale}/admin/bookings`, icon: Mail, label: "Заявки", color: "hover:bg-rose-50 hover:text-rose-700" },
                { href: `/${locale}/admin/tours`, icon: Briefcase, label: "Туры", color: "hover:bg-teal-50 hover:text-teal-700" },
                { href: `/${locale}/admin/moderation`, icon: MessageSquare, label: "Модерация", color: "hover:bg-violet-50 hover:text-violet-700" },
                { href: `/${locale}/admin/payouts`, icon: Wallet, label: "Выплаты", color: "hover:bg-amber-50 hover:text-amber-700" },
                { href: `/${locale}/admin/users`, icon: Users, label: "Юзеры", color: "hover:bg-sky-50 hover:text-sky-700" },
                { href: `/${locale}/admin/partners`, icon: CheckCircle2, label: "Партнёры", color: "hover:bg-emerald-50 hover:text-emerald-700" },
              ].map(({ href, icon: Icon, label, color }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-50 text-slate-600 text-xs font-semibold transition-colors ${color}`}
                >
                  <Icon className="h-4 w-4" />
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
  color: "rose" | "emerald" | "teal" | "amber" | "slate";
  href?: string;
  sub?: string;
}) {
  const colors = {
    rose:    { bg: "bg-rose-50",    text: "text-rose-600",    grad: "from-rose-500 to-rose-600" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", grad: "from-emerald-500 to-emerald-600" },
    teal:    { bg: "bg-teal-50",    text: "text-teal-600",    grad: "from-teal-500 to-teal-600" },
    amber:   { bg: "bg-amber-50",   text: "text-amber-600",   grad: "from-amber-400 to-amber-500" },
    slate:   { bg: "bg-slate-100",  text: "text-slate-600",   grad: "from-slate-400 to-slate-500" },
  };
  const c = colors[color];

  const inner = (
    <div className="tv-surface-elevated p-5 flex items-start gap-3 h-full">
      <div className={`grid place-items-center h-11 w-11 rounded-2xl bg-linear-to-br ${c.grad} text-white shadow-sm shrink-0`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{label}</p>
        <p className="text-2xl font-bold text-slate-900 tabular-nums mt-0.5 leading-tight">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block hover:-translate-y-0.5 transition-transform">
        {inner}
      </Link>
    );
  }
  return inner;
}

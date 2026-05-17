"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import {
  Plane, Share2, Star, Bell, ArrowRight, Compass,
  TrendingUp, Gift, Clock, CheckCircle2, AlertCircle,
} from "lucide-react";
import { bookingsApi } from "@/src/shared/api/bookings-api";
import { referralsApi } from "@/src/shared/api/referrals-api";
import { useAuthStore } from "@/src/shared/store/auth-store";
import type { BookingStatus } from "@tours/types";

const ACTIVE_STATUSES: BookingStatus[] = [
  "NEW", "DOCUMENTS_REQUESTED", "DOCUMENTS_SUBMITTED", "IN_PROGRESS", "AWAITING_PAYMENT",
];

const STATUS_LABELS: Partial<Record<BookingStatus, string>> = {
  NEW: "Новая",
  DOCUMENTS_REQUESTED: "Нужны документы",
  DOCUMENTS_SUBMITTED: "На проверке",
  IN_PROGRESS: "В работе",
  AWAITING_PAYMENT: "Ожидает оплаты",
  PAID: "Оплачена",
  COMPLETED: "Завершена",
  CANCELLED: "Отменена",
};

const STATUS_COLORS: Partial<Record<BookingStatus, { dot: string; text: string }>> = {
  NEW: { dot: "bg-sky-500", text: "text-sky-700" },
  DOCUMENTS_REQUESTED: { dot: "bg-violet-500", text: "text-violet-700" },
  DOCUMENTS_SUBMITTED: { dot: "bg-orange-500", text: "text-orange-700" },
  IN_PROGRESS: { dot: "bg-amber-500", text: "text-amber-700" },
  AWAITING_PAYMENT: { dot: "bg-sky-500", text: "text-sky-700" },
  PAID: { dot: "bg-emerald-500", text: "text-emerald-700" },
  COMPLETED: { dot: "bg-slate-400", text: "text-slate-600" },
  CANCELLED: { dot: "bg-rose-500", text: "text-rose-700" },
};

export function DashboardHome() {
  const locale = useLocale();
  const user = useAuthStore((s) => s.user);

  const { data: tripsData } = useQuery({
    queryKey: ["bookings", "my"],
    queryFn: () => bookingsApi.listMy({ pageSize: 50 }),
  });

  const { data: stats } = useQuery({
    queryKey: ["referrals", "stats"],
    queryFn: () => referralsApi.stats(),
  });

  const allTrips = tripsData?.items ?? [];
  const activeTrips = allTrips.filter((b) => ACTIVE_STATUSES.includes(b.status));
  const recentTrips = [...allTrips]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const firstName = user?.fullName?.split(" ")[0] ?? "Путешественник";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Доброе утро" : hour < 18 ? "Добрый день" : "Добрый вечер";

  const needsAction = allTrips.filter(
    (b) => b.status === "DOCUMENTS_REQUESTED" || b.status === "AWAITING_PAYMENT"
  );

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="tv-surface-elevated p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-500 font-medium">{greeting},</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">{firstName} 👋</h1>
          <p className="text-slate-500 text-sm mt-1">
            {activeTrips.length > 0
              ? `У вас ${activeTrips.length} активн${activeTrips.length === 1 ? "ая заявка" : (activeTrips.length < 5 ? "ые заявки" : "ых заявок")} — следите за статусом`
              : "Готовы к новому путешествию? Посмотрите каталог туров"}
          </p>
        </div>
        <Link
          href={`/${locale}/tours`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white shrink-0 transition-all hover:-translate-y-0.5"
          style={{ background: "var(--gradient-hero)", boxShadow: "0 10px 24px -8px rgba(13,148,136,0.45)" }}
        >
          <Compass className="h-4 w-4" />
          Все туры
        </Link>
      </div>

      {/* Needs attention */}
      {needsAction.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-amber-900 text-sm">
              {needsAction.length === 1
                ? "1 заявка требует вашего действия"
                : `${needsAction.length} заявки требуют вашего действия`}
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              {needsAction.some((b) => b.status === "DOCUMENTS_REQUESTED") && "Нужно загрузить документы. "}
              {needsAction.some((b) => b.status === "AWAITING_PAYMENT") && "Есть заявки, ожидающие оплаты."}
            </p>
          </div>
          <Link
            href={`/${locale}/dashboard/trips`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900 shrink-0"
          >
            Открыть <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStat
          icon={Plane}
          label="Поездок"
          value={String(allTrips.length)}
          color="teal"
          href={`/${locale}/dashboard/trips`}
        />
        <MiniStat
          icon={Clock}
          label="Активных"
          value={String(activeTrips.length)}
          color={activeTrips.length > 0 ? "amber" : "slate"}
          href={`/${locale}/dashboard/trips`}
        />
        <MiniStat
          icon={Share2}
          label="Рефералов"
          value={stats ? String(stats.referralCount) : "—"}
          color="rose"
          href={`/${locale}/dashboard/referrals`}
        />
        <MiniStat
          icon={Gift}
          label="Бесплатных туров"
          value={stats ? String(stats.freeToursAvailable) : "—"}
          color="emerald"
          href={`/${locale}/dashboard/referrals`}
        />
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-5">
        {/* Recent trips */}
        <div className="tv-surface-elevated p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Plane className="h-4 w-4 text-teal-600" />
              Последние заявки
            </h2>
            <Link
              href={`/${locale}/dashboard/trips`}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
            >
              Все <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentTrips.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-teal-50 grid place-items-center mb-3">
                <Compass className="h-5 w-5 text-teal-600" />
              </div>
              <p className="text-sm text-slate-500">Пока нет ни одной заявки</p>
              <Link
                href={`/${locale}/tours`}
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-800"
              >
                Посмотреть туры <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTrips.map((b) => {
                const tour = b.tour;
                const title = tour ? (tour.title.ru ?? tour.slug) : "—";
                const sc = STATUS_COLORS[b.status];
                const sl = STATUS_LABELS[b.status] ?? b.status;
                return (
                  <Link
                    key={b.id}
                    href={`/${locale}/dashboard/trips/${b.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <div className="grid place-items-center h-10 w-10 rounded-xl bg-teal-50 shrink-0">
                      <Plane className="h-4 w-4 text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-teal-700 transition-colors">
                        {title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(b.createdAt).toLocaleDateString("ru-RU")} · {b.guestsCount} чел.
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5">
                      {sc && <span className={`h-2 w-2 rounded-full ${sc.dot}`} />}
                      <span className={`text-xs font-semibold ${sc?.text ?? "text-slate-600"}`}>{sl}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Referral progress + quick actions */}
        <div className="space-y-4">
          {/* Referral card */}
          {stats && (
            <div className="tv-surface-elevated p-5">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-rose-500" />
                Реферальная программа
              </h2>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                    <span>{stats.referralCount} из {stats.threshold} рефералов</span>
                    <span className="font-semibold text-slate-700">{Math.round(stats.progressPercent)}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(stats.progressPercent, 100)}%`,
                        background: "linear-gradient(90deg, #0d9488, #0284c7)",
                      }}
                    />
                  </div>
                  {stats.remaining > 0 && (
                    <p className="text-xs text-slate-500 mt-1.5">
                      Ещё <strong className="text-slate-800">{stats.remaining}</strong> до бесплатного тура
                    </p>
                  )}
                  {stats.freeToursAvailable > 0 && (
                    <p className="text-xs text-emerald-700 font-semibold mt-1.5 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {stats.freeToursAvailable} бесплатный тур доступен!
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-900 tabular-nums">{stats.clicks}</p>
                    <p className="text-[11px] text-slate-500">кликов</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-900 tabular-nums">{stats.registrations}</p>
                    <p className="text-[11px] text-slate-500">регистраций</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-900 tabular-nums">{stats.paidBookings}</p>
                    <p className="text-[11px] text-slate-500">продаж</p>
                  </div>
                </div>
              </div>
              <Link
                href={`/${locale}/dashboard/referrals`}
                className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors"
              >
                <Share2 className="h-4 w-4" />
                Моя реферальная ссылка
              </Link>
            </div>
          )}

          {/* Quick actions */}
          <div className="tv-surface-elevated p-5">
            <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              Быстрые действия
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: `/${locale}/tours`, icon: Compass, label: "Каталог туров", color: "hover:bg-teal-50 hover:text-teal-700" },
                { href: `/${locale}/dashboard/trips`, icon: Plane, label: "Мои поездки", color: "hover:bg-sky-50 hover:text-sky-700" },
                { href: `/${locale}/dashboard/referrals`, icon: Share2, label: "Мои рефералы", color: "hover:bg-rose-50 hover:text-rose-700" },
                { href: `/${locale}/dashboard/notifications`, icon: Bell, label: "Уведомления", color: "hover:bg-violet-50 hover:text-violet-700" },
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

function MiniStat({
  icon: Icon, label, value, color, href,
}: { icon: React.ElementType; label: string; value: string; color: "teal" | "amber" | "rose" | "emerald" | "slate"; href?: string }) {
  const colors = {
    teal:    "bg-teal-50 text-teal-700",
    amber:   "bg-amber-50 text-amber-700",
    rose:    "bg-rose-50 text-rose-700",
    emerald: "bg-emerald-50 text-emerald-700",
    slate:   "bg-slate-100 text-slate-600",
  };
  const c = colors[color];

  const inner = (
    <div className="tv-surface-elevated p-4 flex flex-col items-center text-center gap-2 h-full">
      <div className={`grid place-items-center h-10 w-10 rounded-xl ${c}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xl font-bold text-slate-900 tabular-nums leading-tight">{value}</p>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
    </div>
  );

  if (href) return <Link href={href} className="hover:-translate-y-0.5 transition-transform">{inner}</Link>;
  return inner;
}

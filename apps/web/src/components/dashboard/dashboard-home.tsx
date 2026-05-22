"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
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


const STATUS_COLORS: Partial<Record<BookingStatus, { dot: string; text: string; bg: string }>> = {
  NEW: { dot: "bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.4)]", text: "text-sky-700", bg: "bg-sky-50/70 border-sky-100" },
  DOCUMENTS_REQUESTED: { dot: "bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.4)] animate-pulse", text: "text-violet-700", bg: "bg-violet-50/70 border-violet-100" },
  DOCUMENTS_SUBMITTED: { dot: "bg-teal-500 shadow-[0_0_8px_rgba(13,148,136,0.4)]", text: "text-teal-700", bg: "bg-teal-50/70 border-teal-100" },
  IN_PROGRESS: { dot: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]", text: "text-amber-700", bg: "bg-amber-50/70 border-amber-100" },
  AWAITING_PAYMENT: { dot: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse", text: "text-rose-700", bg: "bg-rose-50/70 border-rose-100" },
  PAID: { dot: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]", text: "text-emerald-700", bg: "bg-emerald-50/70 border-emerald-100" },
  COMPLETED: { dot: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-50/70 border-slate-100" },
  CANCELLED: { dot: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50/70 border-rose-100" },
};

export function DashboardHome() {
  const locale = useLocale();
  const t = useTranslations('dashboard');
  const user = useAuthStore((s) => s.user);

  const STATUS_LABELS: Partial<Record<BookingStatus, string>> = {
    NEW: t('client.trips.statusNew'),
    DOCUMENTS_REQUESTED: t('client.trips.statusDocsNeeded'),
    DOCUMENTS_SUBMITTED: t('client.trips.statusDocsReview'),
    IN_PROGRESS: t('client.trips.statusInProgress'),
    AWAITING_PAYMENT: t('client.trips.statusPayment'),
    PAID: t('client.trips.statusPaid'),
    COMPLETED: t('client.trips.statusCompleted'),
    CANCELLED: t('client.trips.statusCancelled'),
  };

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

  const firstName = user?.fullName?.split(" ")[0] ?? t('client.home.defaultName');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('client.home.greetingMorning') : hour < 18 ? t('client.home.greetingDay') : t('client.home.greetingEvening');

  const needsAction = allTrips.filter(
    (b) => b.status === "DOCUMENTS_REQUESTED" || b.status === "AWAITING_PAYMENT"
  );

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="relative overflow-hidden tv-surface-elevated p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-6 rounded-3xl border border-white/50 shadow-md backdrop-blur-md bg-gradient-to-br from-white/95 to-slate-50/90">
        {/* Glow Effects */}
        <div className="absolute -right-16 -top-16 w-52 h-52 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-52 h-52 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

        <div className="flex-1 min-w-0 relative z-10">
          <p className="text-xs uppercase tracking-wider text-emerald-700 font-bold">{greeting}</p>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1">{firstName} 👋</h1>
          <p className="text-slate-500 text-sm mt-2 font-medium max-w-xl">
            {activeTrips.length > 0
              ? t('client.home.activeBooking', { count: activeTrips.length })
              : t('client.home.noBookingHint')}
          </p>
        </div>
        <Link
          href={`/${locale}/tours`}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm text-white shrink-0 transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_10px_24px_-8px_rgba(4,120,87,0.45)] hover:shadow-[0_12px_28px_-6px_rgba(4,120,87,0.55)] relative z-10"
          style={{ background: "var(--gradient-hero)" }}
        >
          <Compass className="h-4.5 w-4.5 animate-spin-slow" />
          {t('client.home.exploreTours')}
        </Link>
      </div>

      {/* Needs attention */}
      {needsAction.length > 0 && (
        <div className="relative overflow-hidden flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/5 to-transparent border border-rose-200/50 shadow-sm backdrop-blur-sm">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 shrink-0">
            <AlertCircle className="h-5 w-5 animate-bounce" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-rose-900 text-sm">
              {needsAction.length === 1 ? t('client.home.actionRequired') : t('client.home.actionsRequired', { count: needsAction.length })}
            </p>
            <p className="text-xs text-rose-700/80 mt-1 font-medium">
              {needsAction.some((b) => b.status === "DOCUMENTS_REQUESTED") && t('client.home.needDocs')}
              {needsAction.some((b) => b.status === "AWAITING_PAYMENT") && t('client.home.needPayment')}
            </p>
          </div>
          <Link
            href={`/${locale}/dashboard/trips`}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors shrink-0 self-center"
          >
            {t('client.home.open')} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MiniStat
          icon={Plane}
          label={t('client.home.statTrips')}
          value={String(allTrips.length)}
          color="teal"
          href={`/${locale}/dashboard/trips`}
        />
        <MiniStat
          icon={Clock}
          label={t('client.home.statActive')}
          value={String(activeTrips.length)}
          color={activeTrips.length > 0 ? "teal" : "slate"}
          href={`/${locale}/dashboard/trips`}
        />
        <MiniStat
          icon={Share2}
          label={t('client.home.statFriends')}
          value={stats ? String(stats.referralCount) : "0"}
          color="teal"
          href={`/${locale}/dashboard/referrals`}
        />
        <MiniStat
          icon={Gift}
          label={t('client.home.statFreeTours')}
          value={stats ? String(stats.freeToursAvailable) : "0"}
          color="emerald"
          href={`/${locale}/dashboard/referrals`}
        />
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Recent trips */}
        <div className="tv-surface-elevated p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-700">
                  <Plane className="h-4 w-4" />
                </span>
                {t('client.home.recentTitle')}
              </h2>
              <Link
                href={`/${locale}/dashboard/trips`}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline decoration-2"
              >
                {t('client.home.allTrips')} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {recentTrips.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center justify-center">
                <div className="h-16 w-16 rounded-3xl bg-gradient-to-tr from-emerald-500/10 to-emerald-500/5 grid place-items-center mb-4 border border-emerald-500/10">
                  <Compass className="h-7 w-7 text-emerald-600 animate-pulse" />
                </div>
                <p className="text-sm font-semibold text-slate-800">{t('client.home.noBookings')}</p>
                <p className="text-xs text-slate-400 mt-1 max-w-[240px] mx-auto">
                  {t('client.home.noBookingsHint')}
                </p>
                <Link
                  href={`/${locale}/tours`}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                  style={{ background: "var(--gradient-hero)" }}
                >
                  {t('client.home.chooseTour')} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTrips.map((b) => {
                  const tour = b.tour;
                  const title = tour ? (tour.title.ru ?? tour.slug) : "—";
                  const sc = STATUS_COLORS[b.status];
                  const sl = STATUS_LABELS[b.status] ?? b.status;
                  return (
                    <Link
                      key={b.id}
                      href={`/${locale}/dashboard/trips/${b.id}`}
                      className="flex items-center gap-3 p-3 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-slate-50/70 transition-all duration-300 group"
                    >
                      <div className="grid place-items-center h-9 w-9 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-tr from-emerald-500/10 to-emerald-500/5 border border-emerald-500/10 shrink-0 transition-transform duration-300 group-hover:scale-110">
                        <Plane className="h-4 w-4 text-emerald-700 transition-transform duration-500 group-hover:rotate-12" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate group-hover:text-emerald-700 transition-colors">
                          {title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <p className="text-[11px] font-semibold text-slate-400">
                            {new Date(b.createdAt).toLocaleDateString("ru-RU")} · {b.guestsCount} чел.
                          </p>
                          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${sc?.bg ?? "bg-slate-50 border-slate-100"}`}>
                            {sc && <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />}
                            <span className={`text-[9px] font-extrabold uppercase tracking-wide ${sc?.text ?? "text-slate-600"}`}>{sl}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Referral progress + quick actions */}
        <div className="space-y-5">
          {/* Referral card */}
          {stats && (
            <div className="relative overflow-hidden tv-surface-elevated p-6 border border-emerald-500/10 shadow-sm bg-gradient-to-b from-white to-emerald-500/[0.01]">
              {/* Blur accent */}
              <div className="absolute right-0 top-0 w-24 h-24 rounded-full bg-emerald-500/5 blur-2xl pointer-events-none" />

              <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-700">
                  <TrendingUp className="h-4 w-4" />
                </span>
                {t('client.home.referralProgress')}
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-2">
                    <span className="font-bold text-slate-600">{stats.referralCount} {t('client.home.of')} {stats.threshold} {t('client.home.friends')}</span>
                    <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-[10px]">{Math.round(stats.progressPercent)}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100 overflow-hidden shadow-inner p-0.5 border border-slate-200/20">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${Math.min(stats.progressPercent, 100)}%`,
                        background: "linear-gradient(90deg, #047857, #10b981, #34d399)",
                      }}
                    />
                  </div>
                  {stats.remaining > 0 && (
                    <p className="text-[11px] font-semibold text-slate-400 mt-2">
                      {t('client.home.toFreeTour', { count: stats.remaining })}
                    </p>
                  )}
                  {stats.freeToursAvailable > 0 && (
                    <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1.5 animate-pulse bg-emerald-50/70 border border-emerald-100 p-2 rounded-xl">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      {t('client.home.freeAvailable', { count: stats.freeToursAvailable })}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100/80">
                  <div className="text-center group/item cursor-default">
                    <p className="text-2xl font-extrabold text-slate-800 tabular-nums leading-none transition-colors group-hover/item:text-emerald-600">{stats.clicks}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">{t('client.home.clicks')}</p>
                  </div>
                  <div className="text-center group/item cursor-default">
                    <p className="text-2xl font-extrabold text-slate-800 tabular-nums leading-none transition-colors group-hover/item:text-emerald-600">{stats.registrations}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">{t('client.home.registrations')}</p>
                  </div>
                  <div className="text-center group/item cursor-default">
                    <p className="text-2xl font-extrabold text-slate-800 tabular-nums leading-none transition-colors group-hover/item:text-sky-600">{stats.paidBookings}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">{t('client.home.sales')}</p>
                  </div>
                </div>
              </div>
              <Link
                href={`/${locale}/dashboard/referrals`}
                className="mt-5 flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/50 hover:bg-emerald-100/60 hover:text-emerald-800 transition-all duration-300 shadow-sm hover:shadow-md active:scale-98"
              >
                <Share2 className="h-4 w-4" />
                {t('client.home.inviteFriends')}
              </Link>
            </div>
          )}

          {/* Quick actions */}
          <div className="tv-surface-elevated p-6 border border-slate-100 shadow-sm">
            <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
                <Star className="h-4 w-4" />
              </span>
              {t('client.home.quickTitle')}
            </h2>
            <div className="grid grid-cols-2 gap-3.5">
              {[
                { href: `/${locale}/tours`, icon: Compass, label: t('client.home.quickCatalog'), color: "hover:bg-emerald-500/5 hover:text-emerald-700 hover:border-emerald-200/40" },
                { href: `/${locale}/dashboard/trips`, icon: Plane, label: t('client.home.quickTrips'), color: "hover:bg-emerald-500/5 hover:text-emerald-700 hover:border-emerald-200/40" },
                { href: `/${locale}/dashboard/referrals`, icon: Share2, label: t('client.home.quickReferrals'), color: "hover:bg-emerald-500/5 hover:text-emerald-700 hover:border-emerald-200/40" },
                { href: `/${locale}/dashboard/notifications`, icon: Bell, label: t('client.home.quickNotifications'), color: "hover:bg-emerald-500/5 hover:text-emerald-700 hover:border-emerald-200/40" },
              ].map(({ href, icon: Icon, label, color }) => (
                <Link
                  key={href}
                  href={href}
                  className={`group/action flex flex-col items-center gap-2.5 p-4 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 text-xs font-bold transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${color}`}
                >
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200/60 group-hover/action:scale-110 group-hover/action:border-transparent transition-all duration-300 shadow-sm">
                    <Icon className="h-4 w-4 transition-transform duration-300 group-hover/action:rotate-6" />
                  </div>
                  <span>{label}</span>
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
  const colorSchemes = {
    teal: {
      bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 hover:border-emerald-500/40",
      iconBg: "bg-gradient-to-tr from-emerald-600 to-emerald-500 text-white shadow-[0_4px_12px_rgba(4,120,87,0.25)]",
      glow: "group-hover:shadow-[0_12px_24px_-8px_rgba(4,120,87,0.15)]",
    },
    amber: {
      bg: "bg-amber-500/10 border-amber-500/20 text-amber-600 hover:border-amber-500/40",
      iconBg: "bg-gradient-to-tr from-amber-500 to-yellow-500 text-white shadow-[0_4px_12px_rgba(245,158,11,0.25)]",
      glow: "group-hover:shadow-[0_12px_24px_-8px_rgba(245,158,11,0.15)]",
    },
    rose: {
      bg: "bg-rose-500/10 border-rose-500/20 text-rose-600 hover:border-rose-500/40",
      iconBg: "bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-[0_4px_12px_rgba(244,63,94,0.25)]",
      glow: "group-hover:shadow-[0_12px_24px_-8px_rgba(244,63,94,0.15)]",
    },
    emerald: {
      bg: "bg-emerald-600/10 border-emerald-600/20 text-emerald-800 hover:border-emerald-600/40",
      iconBg: "bg-gradient-to-tr from-emerald-700 to-emerald-600 text-white shadow-[0_4px_12px_rgba(4,120,87,0.25)]",
      glow: "group-hover:shadow-[0_12px_24px_-8px_rgba(4,120,87,0.15)]",
    },
    slate: {
      bg: "bg-slate-500/5 border-slate-500/10 text-slate-500 hover:border-slate-500/20",
      iconBg: "bg-gradient-to-tr from-slate-400 to-slate-500 text-white shadow-[0_4px_12px_rgba(148,163,184,0.15)]",
      glow: "group-hover:shadow-[0_12px_24px_-8px_rgba(148,163,184,0.1)]",
    },
  };
  
  const c = colorSchemes[color];

  const inner = (
    <div className={`relative overflow-hidden tv-surface border ${c.bg} p-5 flex flex-col items-center text-center gap-3 h-full transition-all duration-300 rounded-2xl`}>
      <div className={`grid place-items-center h-11 w-11 rounded-xl transition-transform duration-300 group-hover:scale-110 ${c.iconBg}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-extrabold text-slate-900 tabular-nums leading-none mt-1">{value}</p>
        <p className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase mt-1.5">{label}</p>
      </div>
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );

  if (href) return (
    <Link href={href} className={`group block h-full hover:-translate-y-1.5 transition-all duration-300 ${c.glow}`}>
      {inner}
    </Link>
  );
  return <div className="group h-full">{inner}</div>;
}

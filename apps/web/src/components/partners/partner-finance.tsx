"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  Wallet, ArrowDownCircle, ArrowUpCircle, Clock, Check, X as XIcon,
  TrendingUp, ShoppingBag, Banknote, ArrowRight, History, BadgeCheck,
} from "lucide-react";
import { referralsApi } from "@/src/shared/api/referrals-api";
import { payoutsApi } from "@/src/shared/api/payouts-api";
import { PayoutRequestModal } from "./payout-request-modal";

const TYPE_LABEL_CLS: Record<string, { cls: string; icon: React.ElementType }> = {
  COMMISSION_EARNED: { cls: "bg-emerald-50 text-emerald-700 border border-emerald-100", icon: ArrowDownCircle },
  REFERRAL_COUNT:    { cls: "bg-sky-50 text-sky-700 border border-sky-100",             icon: ArrowDownCircle },
  PAYOUT_REQUEST:    { cls: "bg-amber-50 text-amber-700 border border-amber-100",       icon: ArrowUpCircle   },
  PAYOUT_REJECTED:   { cls: "bg-rose-50 text-rose-700 border border-rose-100",          icon: ArrowDownCircle },
  ADMIN_ADJUSTMENT:  { cls: "bg-slate-100 text-slate-700 border border-slate-200",      icon: ArrowDownCircle },
};

const PAYOUT_STATUS_CLS: Record<string, { badgeCls: string; rowCls: string; icon: React.ElementType }> = {
  REQUESTED:  { badgeCls: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",      rowCls: "bg-amber-50/10",   icon: Clock  },
  PROCESSING: { badgeCls: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",      rowCls: "bg-amber-50/10",   icon: Clock  },
  PAID:       { badgeCls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100", rowCls: "bg-emerald-50/5", icon: Check  },
  REJECTED:   { badgeCls: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",          rowCls: "bg-rose-50/5",    icon: XIcon  },
};

export function PartnerFinance() {
  const qc = useQueryClient();
  const t = useTranslations('dashboard');
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  const TYPE_LABEL: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
    COMMISSION_EARNED: { label: t('partner.finance.txCommission'),     ...TYPE_LABEL_CLS.COMMISSION_EARNED! },
    REFERRAL_COUNT:    { label: t('partner.finance.txReferral'),       ...TYPE_LABEL_CLS.REFERRAL_COUNT! },
    PAYOUT_REQUEST:    { label: t('partner.finance.txPayoutRequest'),  ...TYPE_LABEL_CLS.PAYOUT_REQUEST! },
    PAYOUT_REJECTED:   { label: t('partner.finance.txPayoutRejected'), ...TYPE_LABEL_CLS.PAYOUT_REJECTED! },
    ADMIN_ADJUSTMENT:  { label: t('partner.finance.txAdjustment'),     ...TYPE_LABEL_CLS.ADMIN_ADJUSTMENT! },
  };

  const PAYOUT_STATUS: Record<string, { label: string; badgeCls: string; rowCls: string; icon: React.ElementType }> = {
    REQUESTED:  { label: t('partner.finance.statusProcessing'),  ...PAYOUT_STATUS_CLS.REQUESTED! },
    PROCESSING: { label: t('partner.finance.statusHandling'),    ...PAYOUT_STATUS_CLS.PROCESSING! },
    PAID:       { label: t('partner.finance.statusPaid'),        ...PAYOUT_STATUS_CLS.PAID! },
    REJECTED:   { label: t('partner.finance.statusRejected'),    ...PAYOUT_STATUS_CLS.REJECTED! },
  };

  const { data: stats, isLoading: loadingStats, isError } = useQuery({
    queryKey: ["partner", "stats"],
    queryFn: () => referralsApi.partnerStats(),
  });

  const { data: payouts, isLoading: loadingPayouts } = useQuery({
    queryKey: ["payouts", "my"],
    queryFn: () => payoutsApi.listMy(),
  });

  if (loadingStats || !stats) {
    return (
      <div className="space-y-6">
        <div className="h-52 rounded-3xl tv-shimmer" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-2xl tv-shimmer" />)}
        </div>
        <div className="h-20 rounded-2xl tv-shimmer" />
        <div className="h-48 rounded-3xl tv-shimmer" />
      </div>
    );
  }
  if (isError) return <div className="text-rose-600">{t('partner.finance.loadError')}</div>;

  const canRequest = stats.balance >= 50;
  const earnedPct = stats.totals.totalCommission > 0
    ? Math.min(100, (stats.balance / stats.totals.totalCommission) * 100)
    : 0;
  const pendingCount = payouts?.filter(p => p.status === "REQUESTED" || p.status === "PROCESSING").length ?? 0;

  return (
    <div className="space-y-6">

      {/* ── 1. Luxury Balance hero ──────────────────────────────────── */}
      <section
        className="relative overflow-hidden rounded-3xl p-7 md:p-9 text-white"
        style={{
          background: "linear-gradient(135deg, #03956a 0%, #027455 50%, #015e44 100%)",
          boxShadow: "0 20px 40px -12px rgba(2,116,85,0.35)",
        }}
      >
        {/* card texture & glowing spots */}
        <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div aria-hidden className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute bottom-0 left-1/4 h-36 w-80 rounded-full bg-emerald-500/20 blur-3xl" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3.5 py-1 text-[11px] font-black uppercase tracking-widest text-white backdrop-blur-md">
            <Wallet className="h-3.5 w-3.5 text-teal-200" />
            {t('partner.finance.availableBalance')}
          </div>

          <p className="mt-4 text-5xl md:text-6xl font-black tabular-nums tracking-tight drop-shadow-sm">
            ${stats.balance.toFixed(2)}
          </p>
          <p className="mt-2 text-teal-100/90 text-sm font-semibold">
            {t('partner.finance.totalEarned')} <span className="font-black text-white">${stats.totals.totalCommission.toFixed(2)}</span> {t('partner.finance.fromSales', { count: stats.totals.totalPaidBookings })}
          </p>

          {/* progress bar */}
          <div className="mt-6 max-w-md">
            <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-widest text-teal-200 mb-2">
              <span>{t('partner.finance.cardBalance')}</span>
              <span className="tabular-nums text-white">{earnedPct.toFixed(0)}%</span>
            </div>
            <div className="h-2 rounded-full bg-black/20 overflow-hidden border border-white/5">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${earnedPct}%`,
                  background: "linear-gradient(90deg, #fde68a, #fbbf24)",
                  boxShadow: "0 0 12px rgba(251,191,36,0.65)",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. KPI mini-tiles ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiTile
          icon={TrendingUp}
          iconCls="bg-emerald-50 text-emerald-600 border border-emerald-100"
          label={t('partner.finance.cardTotalEarned')}
          value={`$${stats.totals.totalCommission.toFixed(2)}`}
        />
        <KpiTile
          icon={ShoppingBag}
          iconCls="bg-sky-50 text-sky-600 border border-sky-100"
          label={t('partner.finance.cardSales')}
          value={String(stats.totals.totalPaidBookings)}
        />
        <KpiTile
          icon={Clock}
          iconCls="bg-amber-50 text-amber-600 border border-amber-100"
          label={t('partner.finance.cardProcessing')}
          value={String(pendingCount)}
        />
      </div>

      {/* ── 3. Payout CTA ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden tv-surface-elevated p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl border border-slate-100/80 shadow-sm bg-white hover:shadow-md transition-all duration-300">
        <div className="absolute -left-12 -top-12 w-28 h-28 rounded-full bg-gradient-to-br from-emerald-500/5 to-teal-500/5 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
              <Banknote className="h-4 w-4" />
            </span>
            <p className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">{t('partner.finance.requestPayout')}</p>
          </div>
          <p className="text-xs font-semibold text-slate-500 leading-relaxed mt-1">
            {canRequest
              ? t('partner.finance.canRequest', { amount: stats.balance.toFixed(2) })
              : t('partner.finance.minAmount')}
          </p>
        </div>
        <button
          type="button"
          disabled={!canRequest}
          onClick={() => setShowPayoutModal(true)}
          className={`relative z-10 shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            canRequest
              ? "text-white hover:scale-105 active:scale-95 shadow-[0_8px_16px_-6px_rgba(2,116,85,0.35)] hover:shadow-[0_10px_20px_-4px_rgba(2,116,85,0.45)]"
              : "bg-slate-50 text-slate-400 border border-slate-200"
          }`}
          style={canRequest ? {
            background: "linear-gradient(135deg, #03956a, #027455)",
          } : undefined}
        >
          {canRequest ? (
            <>{t('partner.finance.withdraw')} <ArrowRight className="h-4 w-4 text-teal-100" /></>
          ) : (
            <>{t('partner.finance.needMore', { amount: (50 - stats.balance).toFixed(2) })}</>
          )}
        </button>
      </section>

      {/* ── 4. Payout requests ──────────────────────────────────────── */}
      <section className="relative overflow-hidden tv-surface-elevated rounded-3xl border border-slate-100/80 shadow-sm bg-white">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100/80 bg-slate-50/30">
          <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
            <span className="p-1 rounded-lg bg-amber-50 text-amber-500">
              <ArrowUpCircle className="h-4 w-4" />
            </span>
            {t('partner.finance.myPayoutsTitle')}
          </h3>
          {payouts && payouts.length > 0 && (
            <span className="text-[10px] font-extrabold text-slate-500 tabular-nums bg-slate-100 border border-slate-200/50 px-2.5 py-0.5 rounded-full">
              {payouts.length}
            </span>
          )}
        </div>

        {loadingPayouts ? (
          <div className="p-4 space-y-3">
            {[1, 2].map(i => <div key={i} className="h-16 rounded-xl tv-shimmer" />)}
          </div>
        ) : !payouts || payouts.length === 0 ? (
          <div className="py-12 text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 mb-3 border border-slate-100">
              <BadgeCheck className="h-6 w-6" />
            </div>
            <p className="text-sm text-slate-400 font-semibold">{t('partner.finance.noPayouts')}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {payouts.map((p) => {
              const meta = PAYOUT_STATUS[p.status] ?? PAYOUT_STATUS.REQUESTED!;
              const Icon = meta.icon;
              return (
                <div key={p.id} className={`px-6 py-4 flex items-center justify-between gap-3 transition-colors hover:bg-slate-50/50 ${meta.rowCls}`}>
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`grid place-items-center h-10.5 w-10.5 rounded-xl shrink-0 ${meta.badgeCls.split(" ring-1")[0]} shadow-sm`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-800 tabular-nums">${p.amountUsd.toFixed(2)}</p>
                      <p className="text-[11px] text-slate-400 font-semibold mt-1 leading-none">
                        {new Date(p.createdAt).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        {p.processedAt && (
                          <span className="text-emerald-600 font-bold"> · {t('partner.finance.paidAt')} {new Date(p.processedAt).toLocaleDateString("ru-RU")}</span>
                        )}
                      </p>
                      {p.rejectReason && (
                        <p className="text-xs text-rose-600 mt-1 font-semibold">{t('partner.finance.reason')} {p.rejectReason}</p>
                      )}
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${meta.badgeCls}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                    {meta.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 5. Transactions ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden tv-surface-elevated rounded-3xl border border-slate-100/80 shadow-sm bg-white">
        <div className="flex items-center gap-2 px-6 pt-5 pb-4 border-b border-slate-100/80 bg-slate-50/30">
          <span className="p-1 rounded-lg bg-slate-100 text-slate-500">
            <History className="h-4.5 w-4.5" />
          </span>
          <h3 className="font-extrabold text-slate-800">{t('partner.finance.historyTitle')}</h3>
        </div>

        {stats.transactions.length === 0 ? (
          <div className="py-12 text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 mb-3 border border-slate-100">
              <History className="h-6 w-6" />
            </div>
            <p className="text-sm text-slate-400 font-semibold">
              {t('partner.finance.noHistory')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {stats.transactions.map((tx) => {
              const meta = TYPE_LABEL[tx.type] ?? { label: tx.type, cls: "bg-slate-100 text-slate-700 border border-slate-200", icon: ArrowDownCircle };
              const Icon = meta.icon;
              const positive = tx.amountUsd > 0 || tx.increment > 0;
              const isOut = tx.type === "PAYOUT_REQUEST";
              const amount = tx.type === "REFERRAL_COUNT"
                ? `+${tx.increment} реф.`
                : `${tx.amountUsd >= 0 ? "+" : ""}$${tx.amountUsd.toFixed(2)}`;
              return (
                <div key={tx.id} className="px-6 py-4.5 flex items-center gap-4 transition-colors hover:bg-slate-50/50">
                  <div className={`grid place-items-center h-10.5 w-10.5 rounded-xl shrink-0 ${meta.cls} shadow-sm`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400 leading-none">{meta.label}</p>
                    {tx.description ? (
                      <p className="text-sm font-bold text-slate-800 truncate mt-1.5 leading-normal">{tx.description}</p>
                    ) : (
                      <p className="text-sm font-bold text-slate-700 mt-1.5 leading-none">—</p>
                    )}
                    <p className="text-[11px] font-semibold text-slate-400 mt-1 leading-none">
                      {new Date(tx.createdAt).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className={`font-black tabular-nums text-lg shrink-0 ${
                    isOut ? "text-amber-500" : positive ? "text-emerald-500" : "text-rose-500"
                  }`}>
                    {amount}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {showPayoutModal && (
        <PayoutRequestModal
          balance={stats.balance}
          onClose={() => setShowPayoutModal(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ["partner", "stats"] });
            qc.invalidateQueries({ queryKey: ["payouts", "my"] });
          }}
        />
      )}
    </div>
  );
}

function KpiTile({
  icon: Icon, iconCls, label, value,
}: { icon: React.ElementType; iconCls: string; label: string; value: string }) {
  return (
    <div className="relative overflow-hidden tv-surface-elevated p-5 rounded-2xl border border-slate-100/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 bg-white flex items-center gap-4">
      {/* Background soft glow */}
      <div className="absolute -right-8 -bottom-8 w-20 h-20 rounded-full bg-slate-500/[0.01] blur-xl pointer-events-none" />
      
      <div className={`grid place-items-center h-10.5 w-10.5 rounded-xl shrink-0 ${iconCls} shadow-sm`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 leading-tight">{label}</p>
        <p className="mt-1.5 text-2xl font-black tabular-nums text-slate-800 leading-tight">{value}</p>
      </div>
    </div>
  );
}

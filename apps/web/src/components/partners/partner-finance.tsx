"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Wallet, ArrowDownCircle, ArrowUpCircle, Clock, Check, X as XIcon,
  TrendingUp, ShoppingBag, Banknote, ArrowRight, History, BadgeCheck,
} from "lucide-react";
import { referralsApi } from "@/src/shared/api/referrals-api";
import { payoutsApi } from "@/src/shared/api/payouts-api";
import { PayoutRequestModal } from "./payout-request-modal";

const TYPE_LABEL: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  COMMISSION_EARNED: { label: "Комиссия 5%",   cls: "bg-emerald-50 text-emerald-700", icon: ArrowDownCircle },
  REFERRAL_COUNT:    { label: "+1 к счётчику", cls: "bg-sky-50 text-sky-700",         icon: ArrowDownCircle },
  PAYOUT_REQUEST:    { label: "Вывод",          cls: "bg-amber-50 text-amber-700",     icon: ArrowUpCircle   },
  PAYOUT_REJECTED:   { label: "Возврат вывода", cls: "bg-slate-100 text-slate-700",    icon: ArrowDownCircle },
  ADMIN_ADJUSTMENT:  { label: "Корректировка",  cls: "bg-slate-100 text-slate-700",    icon: ArrowDownCircle },
};

const PAYOUT_STATUS: Record<string, { label: string; badgeCls: string; rowCls: string; icon: React.ElementType }> = {
  REQUESTED:  { label: "В обработке",   badgeCls: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",     rowCls: "bg-amber-50/40",   icon: Clock    },
  PROCESSING: { label: "Обрабатывается", badgeCls: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",    rowCls: "bg-amber-50/40",   icon: Clock    },
  PAID:       { label: "Выплачено",     badgeCls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100", rowCls: "bg-emerald-50/30", icon: Check    },
  REJECTED:   { label: "Отклонено",     badgeCls: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",         rowCls: "bg-rose-50/30",    icon: XIcon    },
};

export function PartnerFinance() {
  const qc = useQueryClient();
  const [showPayoutModal, setShowPayoutModal] = useState(false);

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
      <div className="space-y-4">
        <div className="h-48 rounded-3xl tv-shimmer" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl tv-shimmer" />)}
        </div>
        <div className="h-20 rounded-2xl tv-shimmer" />
        <div className="h-40 rounded-2xl tv-shimmer" />
      </div>
    );
  }
  if (isError) return <div className="text-rose-600">Не удалось загрузить данные.</div>;

  const canRequest = stats.balance >= 50;
  const earnedPct = stats.totals.totalCommission > 0
    ? Math.min(100, (stats.balance / stats.totals.totalCommission) * 100)
    : 0;
  const pendingCount = payouts?.filter(p => p.status === "REQUESTED" || p.status === "PROCESSING").length ?? 0;

  return (
    <div className="space-y-4">

      {/* ── 1. Balance hero ─────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden rounded-3xl p-7 md:p-9 text-white"
        style={{
          background: "linear-gradient(135deg, #10b981 0%, #059669 45%, #047857 100%)",
          boxShadow: "0 20px 48px -16px rgba(5, 150, 105, 0.55)",
        }}
      >
        {/* decorative blobs */}
        <div aria-hidden className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute bottom-0 left-1/2 h-40 w-96 -translate-x-1/2 rounded-full bg-black/10 blur-2xl" />

        <div className="relative">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white/90 backdrop-blur">
            <Wallet className="h-3 w-3" />
            Доступный баланс
          </div>

          <p className="mt-3 text-5xl md:text-6xl font-bold tabular-nums tracking-tight">
            ${stats.balance.toFixed(2)}
          </p>
          <p className="mt-1.5 text-white/75 text-sm">
            Всего заработано: <span className="font-bold text-white">${stats.totals.totalCommission.toFixed(2)}</span> с {stats.totals.totalPaidBookings} продаж
          </p>

          {/* progress */}
          <div className="mt-5 max-w-sm">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-widest text-white/60 mb-2">
              <span>Баланс / Заработано</span>
              <span className="tabular-nums text-white/90">{earnedPct.toFixed(0)}%</span>
            </div>
            <div className="h-2 rounded-full bg-black/20 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${earnedPct}%`,
                  background: "linear-gradient(90deg, #fde68a, #fbbf24)",
                  boxShadow: "0 0 8px rgba(251,191,36,0.6)",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. KPI mini-tiles ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiTile
          icon={TrendingUp}
          iconCls="bg-emerald-50 text-emerald-600"
          label="Всего заработано"
          value={`$${stats.totals.totalCommission.toFixed(2)}`}
        />
        <KpiTile
          icon={ShoppingBag}
          iconCls="bg-sky-50 text-sky-600"
          label="Оплаченных продаж"
          value={String(stats.totals.totalPaidBookings)}
        />
        <KpiTile
          icon={Clock}
          iconCls="bg-amber-50 text-amber-600"
          label="Запросов в обработке"
          value={String(pendingCount)}
        />
      </div>

      {/* ── 3. Payout CTA ───────────────────────────────────────────── */}
      <section className="tv-surface-elevated p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <Banknote className="h-4 w-4 text-emerald-600 shrink-0" />
            <p className="font-semibold text-slate-900">Запросить вывод средств</p>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed">
            {canRequest
              ? `На вашем балансе $${stats.balance.toFixed(2)}. Средства поступят в течение 1–2 рабочих дней.`
              : `Минимальная сумма для вывода — $50. Сейчас у вас $${stats.balance.toFixed(2)}.`}
          </p>
        </div>
        <button
          type="button"
          disabled={!canRequest}
          onClick={() => setShowPayoutModal(true)}
          className={`shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all ${
            canRequest
              ? "text-white hover:-translate-y-0.5 active:translate-y-0"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
          style={canRequest ? {
            background: "linear-gradient(135deg, #10b981, #059669)",
            boxShadow: "0 8px 20px -6px rgba(5,150,105,0.50)",
          } : undefined}
        >
          {canRequest ? (
            <>Вывести средства <ArrowRight className="h-4 w-4" /></>
          ) : (
            <>Нужно ещё ${(50 - stats.balance).toFixed(2)}</>
          )}
        </button>
      </section>

      {/* ── 4. Payout requests ──────────────────────────────────────── */}
      <section className="tv-surface-elevated overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <ArrowUpCircle className="h-4 w-4 text-amber-500" />
            Мои запросы на вывод
          </h3>
          {payouts && payouts.length > 0 && (
            <span className="text-xs font-semibold text-slate-400 tabular-nums bg-slate-100 px-2 py-0.5 rounded-full">
              {payouts.length}
            </span>
          )}
        </div>

        {loadingPayouts ? (
          <div className="p-4 space-y-2">
            {[1, 2].map(i => <div key={i} className="h-16 rounded-xl tv-shimmer" />)}
          </div>
        ) : !payouts || payouts.length === 0 ? (
          <div className="py-10 text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-slate-100 mb-3">
              <BadgeCheck className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">Запросов на вывод ещё не было.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {payouts.map((p) => {
              const meta = PAYOUT_STATUS[p.status] ?? PAYOUT_STATUS.REQUESTED!;
              const Icon = meta.icon;
              return (
                <div key={p.id} className={`px-6 py-4 flex items-center justify-between gap-3 ${meta.rowCls}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`grid place-items-center h-10 w-10 rounded-xl ${meta.badgeCls.split(" ring-1")[0]}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 tabular-nums">${p.amountUsd.toFixed(2)}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(p.createdAt).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        {p.processedAt && (
                          <span className="text-emerald-600 font-medium"> · Обработан: {new Date(p.processedAt).toLocaleDateString("ru-RU")}</span>
                        )}
                      </p>
                      {p.rejectReason && (
                        <p className="text-xs text-rose-600 mt-0.5">Причина: {p.rejectReason}</p>
                      )}
                    </div>
                  </div>
                  <span className={`tv-chip ${meta.badgeCls}`}>
                    <Icon className="w-3 h-3" />
                    {meta.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 5. Transactions ─────────────────────────────────────────── */}
      <section className="tv-surface-elevated overflow-hidden">
        <div className="flex items-center gap-2 px-6 pt-5 pb-4 border-b border-slate-100">
          <History className="h-4 w-4 text-slate-500" />
          <h3 className="font-semibold text-slate-900">История транзакций</h3>
        </div>

        {stats.transactions.length === 0 ? (
          <div className="py-10 text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-slate-100 mb-3">
              <History className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">
              Транзакции появятся, когда менеджер отметит первую заявку оплаченной.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {stats.transactions.map((tx) => {
              const meta = TYPE_LABEL[tx.type] ?? { label: tx.type, cls: "bg-slate-100 text-slate-700", icon: ArrowDownCircle };
              const Icon = meta.icon;
              const positive = tx.amountUsd > 0 || tx.increment > 0;
              const isOut = tx.type === "PAYOUT_REQUEST";
              const amount = tx.type === "REFERRAL_COUNT"
                ? `+${tx.increment} реф.`
                : `${tx.amountUsd >= 0 ? "+" : ""}$${tx.amountUsd.toFixed(2)}`;
              return (
                <div key={tx.id} className="px-6 py-4 flex items-center gap-4">
                  <div className={`grid place-items-center h-10 w-10 rounded-xl shrink-0 ${meta.cls}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{meta.label}</p>
                    {tx.description && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">{tx.description}</p>
                    )}
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {new Date(tx.createdAt).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className={`font-bold tabular-nums text-base shrink-0 ${
                    isOut ? "text-amber-600" : positive ? "text-emerald-600" : "text-rose-600"
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
    <div className="tv-kpi flex items-start gap-3">
      <div className={`grid place-items-center h-10 w-10 rounded-xl shrink-0 ${iconCls}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 leading-tight">{label}</p>
        <p className="mt-1 text-xl font-bold tabular-nums text-slate-900 leading-tight">{value}</p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Wallet, ArrowDownCircle, ArrowUpCircle, Clock, Check, X as XIcon,
  Sparkles, History,
} from "lucide-react";
import { referralsApi } from "@/src/shared/api/referrals-api";
import { payoutsApi } from "@/src/shared/api/payouts-api";
import { Button } from "@/src/components/ui/button";
import { PayoutRequestModal } from "./payout-request-modal";

const TYPE_LABEL: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  COMMISSION_EARNED: { label: "Комиссия 5%", cls: "bg-emerald-50 text-emerald-700", icon: ArrowDownCircle },
  REFERRAL_COUNT:    { label: "+1 к счётчику", cls: "bg-sky-50 text-sky-700", icon: ArrowDownCircle },
  PAYOUT_REQUEST:    { label: "Вывод",        cls: "bg-amber-50 text-amber-700", icon: ArrowUpCircle },
  PAYOUT_REJECTED:   { label: "Возврат вывода", cls: "bg-slate-100 text-slate-700", icon: ArrowDownCircle },
  ADMIN_ADJUSTMENT:  { label: "Корректировка",  cls: "bg-slate-100 text-slate-700", icon: ArrowDownCircle },
};

const PAYOUT_STATUS: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  REQUESTED:  { label: "В обработке",  cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-100", icon: Clock },
  PROCESSING: { label: "Обрабатывается", cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-100", icon: Clock },
  PAID:       { label: "Выплачено",    cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100", icon: Check },
  REJECTED:   { label: "Отклонено",    cls: "bg-rose-50 text-rose-700 ring-1 ring-rose-100", icon: XIcon },
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
      <div className="space-y-6">
        <div className="h-44 rounded-3xl tv-shimmer" />
        <div className="h-32 rounded-2xl tv-shimmer" />
        <div className="h-40 rounded-2xl tv-shimmer" />
      </div>
    );
  }
  if (isError) return <div className="text-rose-600">Не удалось загрузить.</div>;

  const canRequest = stats.balance >= 50;
  const earnedPct = stats.totals.totalCommission > 0
    ? Math.min(100, (stats.balance / stats.totals.totalCommission) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Balance hero */}
      <section className="tv-hero tv-hero-forest p-7 md:p-9">
        <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
              <Wallet className="h-3 w-3" /> Доступный баланс
            </div>
            <p className="mt-3 text-5xl md:text-6xl font-bold tracking-tight tabular-nums text-white">
              ${stats.balance.toFixed(2)}
            </p>
            <p className="mt-2 text-white/85 text-sm">
              Всего заработано: <strong className="text-white">${stats.totals.totalCommission.toFixed(2)}</strong> с {stats.totals.totalPaidBookings} продаж
            </p>

            {/* progress */}
            <div className="mt-4 max-w-sm">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.1em] text-white/70 mb-1.5">
                <span>Баланс / Заработано</span>
                <span className="tabular-nums">{earnedPct.toFixed(0)}%</span>
              </div>
              <div className="h-2 rounded-full bg-black/25 overflow-hidden">
                <div
                  className="h-full rounded-full bg-linear-to-r from-amber-300 to-amber-400"
                  style={{ width: `${earnedPct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="shrink-0 w-full md:w-auto">
            <button
              type="button"
              disabled={!canRequest}
              onClick={() => setShowPayoutModal(true)}
              className={`w-full md:w-auto px-6 py-3.5 rounded-2xl font-semibold text-base transition-all ${
                canRequest
                  ? "bg-white text-emerald-700 hover:bg-emerald-50 shadow-[0_10px_24px_-8px_rgba(0,0,0,0.35)] hover:-translate-y-0.5"
                  : "bg-white/20 text-white/70 backdrop-blur cursor-not-allowed"
              }`}
            >
              {canRequest ? "Запросить вывод" : "Минимум $50 для вывода"}
            </button>
            {canRequest && (
              <p className="mt-2 text-xs text-white/70 text-center md:text-right inline-flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Обычно обрабатываем за 1–2 дня
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Payouts */}
      <section className="tv-surface-elevated p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <ArrowUpCircle className="h-4 w-4 text-amber-600" />
            Мои запросы на вывод
          </h3>
          {payouts && payouts.length > 0 && (
            <span className="text-xs font-semibold text-slate-500 tabular-nums">
              {payouts.length} {payouts.length === 1 ? "запрос" : "запросов"}
            </span>
          )}
        </div>
        {loadingPayouts ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <div key={i} className="h-14 rounded-xl tv-shimmer" />)}
          </div>
        ) : !payouts || payouts.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-slate-500 text-sm">Запросов ещё не было.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {payouts.map((p) => {
              const meta = PAYOUT_STATUS[p.status]!;
              const Icon = meta.icon;
              return (
                <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`grid place-items-center h-10 w-10 rounded-xl ${meta.cls.split(" ring-1")[0]}`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 tabular-nums">${p.amountUsd.toFixed(2)}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(p.createdAt).toLocaleString("ru-RU")}
                        {p.processedAt && ` · Обработан: ${new Date(p.processedAt).toLocaleDateString("ru-RU")}`}
                      </p>
                      {p.rejectReason && (
                        <p className="text-xs text-rose-600 italic mt-0.5">Причина: {p.rejectReason}</p>
                      )}
                    </div>
                  </div>
                  <span className={`tv-chip ${meta.cls}`}>
                    <Icon className="w-3 h-3" />
                    {meta.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Transactions */}
      <section className="tv-surface-elevated p-6">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <History className="h-4 w-4 text-slate-600" />
          История транзакций
        </h3>
        {stats.transactions.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">
            Пока нет транзакций. Они появятся, когда менеджер пометит первую заявку оплаченной.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {stats.transactions.map((tx) => {
              const meta = TYPE_LABEL[tx.type] ?? { label: tx.type, cls: "bg-slate-100 text-slate-700", icon: ArrowDownCircle };
              const Icon = meta.icon;
              const positive = tx.amountUsd > 0 || tx.increment > 0;
              const amount = tx.type === "REFERRAL_COUNT"
                ? `+${tx.increment}`
                : `${tx.amountUsd >= 0 ? "+" : ""}$${tx.amountUsd.toFixed(2)}`;
              return (
                <div key={tx.id} className="py-3 flex items-center gap-3">
                  <span className={`grid place-items-center h-10 w-10 rounded-xl ${meta.cls}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{meta.label}</p>
                    {tx.description && <p className="text-xs text-slate-500 truncate">{tx.description}</p>}
                    <p className="text-xs text-slate-400">{new Date(tx.createdAt).toLocaleString("ru-RU")}</p>
                  </div>
                  <span className={`font-semibold tabular-nums text-base ${positive ? "text-emerald-600" : "text-amber-600"}`}>
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

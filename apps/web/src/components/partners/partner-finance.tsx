"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Wallet, ArrowDownCircle, ArrowUpCircle, Clock, Check, X as XIcon } from "lucide-react";
import { referralsApi } from "@/src/shared/api/referrals-api";
import { payoutsApi } from "@/src/shared/api/payouts-api";
import { Button } from "@/src/components/ui/button";
import { PayoutRequestModal } from "./payout-request-modal";

const TYPE_LABEL: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  COMMISSION_EARNED: { label: "Комиссия 5%", cls: "text-emerald-700 bg-emerald-50", icon: ArrowDownCircle },
  REFERRAL_COUNT:    { label: "+1 к счётчику", cls: "text-blue-700 bg-blue-50", icon: ArrowDownCircle },
  PAYOUT_REQUEST:    { label: "Вывод", cls: "text-amber-700 bg-amber-50", icon: ArrowUpCircle },
  PAYOUT_REJECTED:   { label: "Возврат вывода", cls: "text-zinc-700 bg-zinc-100", icon: ArrowDownCircle },
  ADMIN_ADJUSTMENT:  { label: "Корректировка", cls: "text-zinc-700 bg-zinc-100", icon: ArrowDownCircle },
};

const PAYOUT_STATUS: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  REQUESTED:  { label: "В обработке",  cls: "bg-amber-100 text-amber-700", icon: Clock },
  PROCESSING: { label: "Обрабатывается", cls: "bg-amber-100 text-amber-700", icon: Clock },
  PAID:       { label: "Выплачено",    cls: "bg-emerald-100 text-emerald-700", icon: Check },
  REJECTED:   { label: "Отклонено",    cls: "bg-red-100 text-red-700", icon: XIcon },
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
    return <div className="text-zinc-500">Загрузка…</div>;
  }
  if (isError) return <div className="text-red-600">Не удалось загрузить.</div>;

  const canRequest = stats.balance >= 50;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white rounded-2xl p-6">
        <div className="flex items-center gap-2 text-emerald-100 text-sm">
          <Wallet className="w-4 h-4" /> Доступный баланс
        </div>
        <p className="text-4xl font-bold mt-2">${stats.balance.toFixed(2)}</p>
        <p className="text-emerald-100 text-sm mt-2">
          Всего заработано: ${stats.totals.totalCommission.toFixed(2)} с {stats.totals.totalPaidBookings} продаж
        </p>
        <Button
          variant="outline"
          className="mt-4 bg-white text-emerald-800 hover:bg-emerald-50 border-white"
          disabled={!canRequest}
          onClick={() => setShowPayoutModal(true)}
        >
          {canRequest ? "Запросить вывод" : "Минимум $50 для вывода"}
        </Button>
      </div>

      {/* Запросы на вывод */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h3 className="font-semibold text-zinc-900 mb-4">Мои запросы на вывод</h3>
        {loadingPayouts ? (
          <p className="text-zinc-500 text-sm">Загрузка…</p>
        ) : !payouts || payouts.length === 0 ? (
          <p className="text-zinc-500 text-sm">Запросов ещё не было.</p>
        ) : (
          <div className="divide-y divide-zinc-100">
            {payouts.map((p) => {
              const meta = PAYOUT_STATUS[p.status]!;
              const Icon = meta.icon;
              return (
                <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`p-2 rounded-md ${meta.cls}`}><Icon className="w-4 h-4" /></span>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">${p.amountUsd.toFixed(2)}</p>
                      <p className="text-xs text-zinc-500">
                        {new Date(p.createdAt).toLocaleString("ru-RU")}
                        {p.processedAt && ` • Обработан: ${new Date(p.processedAt).toLocaleDateString("ru-RU")}`}
                      </p>
                      {p.rejectReason && (
                        <p className="text-xs text-red-600 italic mt-0.5">Причина: {p.rejectReason}</p>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${meta.cls}`}>
                    {meta.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* История транзакций */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h3 className="font-semibold text-zinc-900 mb-4">История транзакций</h3>
        {stats.transactions.length === 0 ? (
          <p className="text-zinc-500 text-sm">Пока нет транзакций. Они появятся, когда менеджер пометит первую заявку оплаченной.</p>
        ) : (
          <div className="divide-y divide-zinc-100">
            {stats.transactions.map((tx) => {
              const meta = TYPE_LABEL[tx.type] ?? { label: tx.type, cls: "text-zinc-700 bg-zinc-100", icon: ArrowDownCircle };
              const Icon = meta.icon;
              const positive = tx.amountUsd > 0 || tx.increment > 0;
              const amount = tx.type === "REFERRAL_COUNT"
                ? `+${tx.increment}`
                : `${tx.amountUsd >= 0 ? "+" : ""}$${tx.amountUsd.toFixed(2)}`;
              return (
                <div key={tx.id} className="py-3 flex items-center gap-3">
                  <span className={`p-2 rounded-md ${meta.cls}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900">{meta.label}</p>
                    {tx.description && <p className="text-xs text-zinc-500 truncate">{tx.description}</p>}
                    <p className="text-xs text-zinc-400">{new Date(tx.createdAt).toLocaleString("ru-RU")}</p>
                  </div>
                  <span className={`font-semibold tabular-nums ${positive ? "text-emerald-600" : "text-amber-600"}`}>
                    {amount}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

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

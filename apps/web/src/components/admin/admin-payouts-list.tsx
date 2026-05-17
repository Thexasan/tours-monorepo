"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X, Building2 } from "lucide-react";
import { payoutsApi } from "@/src/shared/api/payouts-api";
import { extractErrorMessage } from "@/src/shared/api/apiClient";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";

const STATUS_FILTERS = [
  { value: "REQUESTED", label: "Ждут обработки" },
  { value: "PAID", label: "Выплачены" },
  { value: "REJECTED", label: "Отклонены" },
] as const;

interface BankDetails {
  bank?: string; accountNumber?: string; swift?: string; beneficiary?: string;
}

export function AdminPayoutsList() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"REQUESTED" | "PAID" | "REJECTED">("REQUESTED");
  const [approving, setApproving] = useState<{ id: string; ref: string } | null>(null);
  const [rejecting, setRejecting] = useState<{ id: string; reason: string } | null>(null);

  const { data: payouts, isLoading } = useQuery({
    queryKey: ["admin", "payouts", filter],
    queryFn: () => payoutsApi.listAll(filter),
  });

  const approveM = useMutation({
    mutationFn: (vars: { id: string; externalRef?: string }) =>
      payoutsApi.process(vars.id, "APPROVE", { externalRef: vars.externalRef }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "payouts"] });
      setApproving(null);
      toast.success("Выплата подтверждена");
    },
    onError: (e) => toast.error("Не удалось подтвердить выплату", { description: extractErrorMessage(e) }),
  });
  const rejectM = useMutation({
    mutationFn: (vars: { id: string; reason: string }) =>
      payoutsApi.process(vars.id, "REJECT", { rejectReason: vars.reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "payouts"] });
      setRejecting(null);
      toast.success("Запрос отклонён, средства возвращены на баланс");
    },
    onError: (e) => toast.error("Не удалось отклонить запрос", { description: extractErrorMessage(e) }),
  });

  return (
    <>
      <div className="flex gap-2 mb-4">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value} type="button"
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              filter === f.value
                ? "bg-blue-600 text-white"
                : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-zinc-500">Загрузка...</p>}

      {payouts && payouts.length === 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center text-zinc-500">
          Запросов в этом статусе нет.
        </div>
      )}

      <div className="space-y-3">
        {payouts?.map((p) => {
          const bank = p.bankDetails as unknown as BankDetails;
          return (
            <div key={p.id} className="bg-white rounded-xl border border-zinc-200 p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="text-2xl font-bold text-zinc-900">${p.amountUsd.toFixed(2)}</p>
                  <p className="text-sm text-zinc-600">{p.user.fullName} ({p.user.email})</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Запрошено {new Date(p.createdAt).toLocaleString("ru-RU")}
                  </p>
                </div>
              </div>

              <div className="bg-zinc-50 rounded-md p-3 text-sm space-y-1 mb-3">
                <div className="flex items-center gap-2 text-zinc-700 font-medium">
                  <Building2 className="w-4 h-4" /> Банковские реквизиты
                </div>
                <p><span className="text-zinc-500">Банк:</span> {bank.bank}</p>
                <p><span className="text-zinc-500">Счёт:</span> <span className="font-mono">{bank.accountNumber}</span></p>
                {bank.swift && <p><span className="text-zinc-500">SWIFT:</span> <span className="font-mono">{bank.swift}</span></p>}
                <p><span className="text-zinc-500">Получатель:</span> {bank.beneficiary}</p>
              </div>

              {p.status === "PAID" && p.externalRef && (
                <p className="text-sm text-emerald-700 mb-2">
                  ✓ Выплата подтверждена. Ref: <span className="font-mono">{p.externalRef}</span>
                </p>
              )}
              {p.status === "REJECTED" && p.rejectReason && (
                <p className="text-sm text-red-700 italic mb-2">
                  Отклонено: {p.rejectReason}
                </p>
              )}

              {p.status === "REQUESTED" && (
                <>
                  {approving?.id === p.id ? (
                    <div className="space-y-2 mt-3 pt-3 border-t border-zinc-100">
                      <Input
                        placeholder="ID банковской транзакции (опционально)"
                        value={approving.ref}
                        onChange={(e) => setApproving({ ...approving, ref: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <Button
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => approveM.mutate({ id: p.id, externalRef: approving.ref || undefined })}
                          disabled={approveM.isPending}
                        >
                          Подтвердить выплату
                        </Button>
                        <Button variant="outline" onClick={() => setApproving(null)}>
                          Отмена
                        </Button>
                      </div>
                    </div>
                  ) : rejecting?.id === p.id ? (
                    <div className="space-y-2 mt-3 pt-3 border-t border-zinc-100">
                      <textarea
                        placeholder="Причина отклонения... (например: неверные реквизиты)"
                        value={rejecting.reason}
                        onChange={(e) => setRejecting({ ...rejecting, reason: e.target.value })}
                        rows={2}
                        className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          onClick={() => rejectM.mutate({ id: p.id, reason: rejecting.reason })}
                          disabled={rejectM.isPending || !rejecting.reason.trim()}
                        >
                          Отклонить (вернуть на баланс)
                        </Button>
                        <Button variant="outline" onClick={() => setRejecting(null)}>
                          Отмена
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-100">
                      <Button
                        onClick={() => setApproving({ id: p.id, ref: "" })}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Check className="w-4 h-4 mr-1" /> Я перевёл деньги
                      </Button>
                      <Button variant="outline" onClick={() => setRejecting({ id: p.id, reason: "" })}>
                        <X className="w-4 h-4 mr-1" /> Отклонить
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

    </>
  );
}

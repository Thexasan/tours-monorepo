"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { payoutsApi } from "@/src/shared/api/payouts-api";
import { extractErrorMessage } from "@/src/shared/api/apiClient";
import { toast } from "sonner";

const schema = z.object({
  amountUsd: z.coerce.number().min(50, "Минимум $50"),
  bank: z.string().min(2).max(200),
  accountNumber: z.string().min(4).max(50),
  swift: z.string().max(20).optional().or(z.literal("")),
  beneficiary: z.string().min(2).max(200),
});
type Inp = z.input<typeof schema>;
type Out = z.output<typeof schema>;

export function PayoutRequestModal({
  balance, onClose, onSuccess,
}: {
  balance: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register, handleSubmit, formState: { errors },
  } = useForm<Inp, unknown, Out>({
    resolver: zodResolver(schema),
    defaultValues: { amountUsd: Math.min(balance, 50), bank: "", accountNumber: "", swift: "", beneficiary: "" },
  });

  const onSubmit = async (v: Out) => {
    if (v.amountUsd > balance) {
      setError(`Недостаточно средств. Доступно: $${balance.toFixed(2)}`);
      return;
    }
    setSubmitting(true); setError(null);
    try {
      await payoutsApi.request({
        amountUsd: v.amountUsd,
        bankDetails: {
          bank: v.bank,
          accountNumber: v.accountNumber,
          swift: v.swift || undefined,
          beneficiary: v.beneficiary,
        },
      });
      toast.success("Заявка на выплату отправлена");
      onSuccess();
      onClose();
    } catch (e) {
      const msg = extractErrorMessage(e);
      setError(msg);
      toast.error("Не удалось отправить заявку", { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-zinc-200">
          <h3 className="text-lg font-semibold">Запрос вывода средств</h3>
          <button type="button" onClick={onClose} aria-label="Закрыть"
            className="text-zinc-400 hover:text-zinc-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 flex flex-col gap-4">
          <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3 text-sm">
            <p className="text-emerald-800">
              <strong>Доступно:</strong> ${balance.toFixed(2)}
            </p>
          </div>

          <div>
            <Label htmlFor="amountUsd">Сумма к выводу (USD)</Label>
            <Input id="amountUsd" type="number" step="0.01" min={50} max={balance} {...register("amountUsd")} />
            {errors.amountUsd && <p className="mt-1 text-xs text-red-600">{errors.amountUsd.message}</p>}
            <p className="text-xs text-zinc-500 mt-1">Минимум $50.</p>
          </div>

          <div>
            <Label htmlFor="bank">Банк</Label>
            <Input id="bank" placeholder="Tinkoff, Sberbank, Bank of America..." {...register("bank")} />
            {errors.bank && <p className="mt-1 text-xs text-red-600">{errors.bank.message}</p>}
          </div>

          <div>
            <Label htmlFor="accountNumber">Номер счёта/карты</Label>
            <Input id="accountNumber" placeholder="40817810..." {...register("accountNumber")} />
            {errors.accountNumber && <p className="mt-1 text-xs text-red-600">{errors.accountNumber.message}</p>}
          </div>

          <div>
            <Label htmlFor="swift">SWIFT/BIC (для международных)</Label>
            <Input id="swift" placeholder="TICSRUMM" {...register("swift")} />
          </div>

          <div>
            <Label htmlFor="beneficiary">Получатель (как в банке)</Label>
            <Input id="beneficiary" placeholder="Ivanov Ivan Ivanovich" {...register("beneficiary")} />
            {errors.beneficiary && <p className="mt-1 text-xs text-red-600">{errors.beneficiary.message}</p>}
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
          )}

          <div className="text-xs text-zinc-500 bg-zinc-50 p-3 rounded-md">
            После подтверждения сумма будет <strong>списана с баланса</strong>. Если админ отклонит запрос — деньги вернутся на баланс автоматически.
          </div>

          <div className="flex gap-3 mt-2">
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? "Отправляем..." : "Запросить вывод"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Отмена
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

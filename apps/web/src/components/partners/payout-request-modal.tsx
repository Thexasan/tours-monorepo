"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Banknote, CreditCard, Globe, User, Info, ArrowRight } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { payoutsApi } from "@/src/shared/api/payouts-api";
import { extractErrorMessage } from "@/src/shared/api/apiClient";
import { toast } from "sonner";

const schema = z.object({
  amountUsd:     z.coerce.number().min(50, "Минимум $50"),
  bank:          z.string().min(2).max(200),
  accountNumber: z.string().min(4).max(50),
  swift:         z.string().max(20).optional().or(z.literal("")),
  beneficiary:   z.string().min(2).max(200),
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
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<Inp, unknown, Out>({
    resolver: zodResolver(schema),
    defaultValues: { amountUsd: Math.min(balance, 50), bank: "", accountNumber: "", swift: "", beneficiary: "" },
  });

  const amount = Number(watch("amountUsd")) || 0;
  const overBalance = amount > balance;

  const onSubmit = async (v: Out) => {
    if (v.amountUsd > balance) {
      setServerError(`Недостаточно средств. Доступно: $${balance.toFixed(2)}`);
      return;
    }
    setSubmitting(true);
    setServerError(null);
    try {
      await payoutsApi.request({
        amountUsd: v.amountUsd,
        bankDetails: {
          bank:          v.bank,
          accountNumber: v.accountNumber,
          swift:         v.swift || undefined,
          beneficiary:   v.beneficiary,
        },
      });
      toast.success("Заявка на выплату отправлена");
      onSuccess();
      onClose();
    } catch (e) {
      const msg = extractErrorMessage(e);
      setServerError(msg);
      toast.error("Не удалось отправить заявку", { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white sm:rounded-3xl rounded-t-3xl max-h-[92dvh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Запрос вывода средств</h3>
            <p className="text-xs text-slate-500 mt-0.5">Обрабатываем в течение 1–2 рабочих дней</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="grid place-items-center h-9 w-9 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-6 pt-5 flex flex-col gap-5">

          {/* Balance pill */}
          <div className="flex items-center justify-between rounded-2xl px-4 py-3"
            style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", border: "1px solid #bbf7d0" }}>
            <div className="flex items-center gap-2">
              <div className="grid place-items-center h-8 w-8 rounded-xl bg-emerald-500/15">
                <Banknote className="h-4 w-4 text-emerald-700" />
              </div>
              <p className="text-sm font-semibold text-emerald-800">Доступно к выводу</p>
            </div>
            <p className="text-lg font-bold tabular-nums text-emerald-700">${balance.toFixed(2)}</p>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amountUsd" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Сумма к выводу (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
              <Input
                id="amountUsd"
                type="number"
                step="0.01"
                min={50}
                max={balance}
                className={`pl-7 font-semibold text-base ${overBalance ? "border-rose-400 focus:ring-rose-300" : ""}`}
                {...register("amountUsd")}
              />
            </div>
            {errors.amountUsd && (
              <p className="mt-1 text-xs text-rose-600">{errors.amountUsd.message}</p>
            )}
            {overBalance && !errors.amountUsd && (
              <p className="mt-1 text-xs text-rose-600">Превышает доступный баланс</p>
            )}
            <p className="mt-1 text-[11px] text-slate-400">Минимальная сумма — $50</p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-100" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Банковские реквизиты</p>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* Bank */}
          <div>
            <label htmlFor="bank" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              <span className="flex items-center gap-1.5"><CreditCard className="h-3 w-3" />Банк</span>
            </label>
            <Input id="bank" placeholder="Введите название банка" {...register("bank")} />
            {errors.bank && <p className="mt-1 text-xs text-rose-600">{errors.bank.message}</p>}
          </div>

          {/* Account number */}
          <div>
            <label htmlFor="accountNumber" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Номер счёта / карты
            </label>
            <Input id="accountNumber" placeholder="Введите номер счёта или карты" {...register("accountNumber")} />
            {errors.accountNumber && <p className="mt-1 text-xs text-rose-600">{errors.accountNumber.message}</p>}
          </div>

          {/* SWIFT */}
          <div>
            <label htmlFor="swift" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Globe className="h-3 w-3" />SWIFT / BIC
                <span className="font-normal normal-case tracking-normal text-slate-400">(для международных переводов)</span>
              </span>
            </label>
            <Input id="swift" placeholder="Введите SWIFT-код (необязательно)" {...register("swift")} />
          </div>

          {/* Beneficiary */}
          <div>
            <label htmlFor="beneficiary" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              <span className="flex items-center gap-1.5"><User className="h-3 w-3" />Получатель</span>
            </label>
            <Input id="beneficiary" placeholder="Введите имя получателя (как в банке)" {...register("beneficiary")} />
            {errors.beneficiary && <p className="mt-1 text-xs text-rose-600">{errors.beneficiary.message}</p>}
          </div>

          {/* Info note */}
          <div className="flex gap-2.5 rounded-2xl bg-slate-50 border border-slate-100 p-4">
            <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 leading-relaxed">
              После подтверждения сумма будет <strong className="text-slate-700">списана с баланса</strong>. Если администратор отклонит запрос — деньги вернутся автоматически.
            </p>
          </div>

          {/* Server error */}
          {serverError && (
            <div className="rounded-2xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700">
              {serverError}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-2xl text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitting || overBalance}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
              style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
                boxShadow: "0 8px 20px -6px rgba(5,150,105,0.45)",
              }}
            >
              {submitting ? "Отправляем…" : (
                <>Запросить вывод <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

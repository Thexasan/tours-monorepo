"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X, Building2, Calendar, User, Copy, Receipt, CheckCircle2, AlertTriangle, ArrowUpRight, ShieldX, RefreshCw } from "lucide-react";
import { payoutsApi } from "@/src/shared/api/payouts-api";
import { extractErrorMessage } from "@/src/shared/api/apiClient";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";

interface BankDetails {
  bank?: string;
  accountNumber?: string;
  swift?: string;
  beneficiary?: string;
}

export function AdminPayoutsList() {
  const qc = useQueryClient();
  const t = useTranslations('dashboard');

  const STATUS_FILTERS = [
    { value: "REQUESTED", label: t('admin.payouts.tabPending') },
    { value: "PAID", label: t('admin.payouts.tabPaid') },
    { value: "REJECTED", label: t('admin.payouts.tabRejected') },
  ] as const;

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

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} скопирован в буфер обмена`);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* ── Toolbar & Filter ────────────────────────────────────── */}
      <div className="tv-surface-elevated p-4 bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="flex flex-wrap p-1 gap-1 select-none bg-slate-50 border border-slate-200/50 rounded-xl max-w-fit">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => {
                setFilter(f.value);
                setApproving(null);
                setRejecting(null);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                filter === f.value
                  ? "bg-white text-slate-900 border border-slate-200/60 shadow-xs scale-103"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Loading State ───────────────────────────────────────── */}
      {isLoading && (
        <div className="tv-surface-elevated p-12 text-center text-slate-500 bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col items-center justify-center gap-3">
          <RefreshCw className="h-6 w-6 text-teal-600 animate-spin" />
          <p className="text-sm font-semibold">{t('admin.payouts.loading')}</p>
        </div>
      )}

      {/* ── Empty State ─────────────────────────────────────────── */}
      {!isLoading && payouts && payouts.length === 0 && (
        <div className="tv-surface-elevated p-16 text-center text-slate-400 bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <Receipt className="h-10 w-10 text-slate-300 mx-auto mb-3.5" />
          <p className="text-sm font-bold text-slate-800">{t('admin.payouts.notFound')}</p>
          <p className="text-xs text-slate-400 mt-1">{t('admin.payouts.notFoundDesc')}</p>
        </div>
      )}

      {/* ── Payouts Grid ────────────────────────────────────────── */}
      {!isLoading && payouts && payouts.length > 0 && (
        <div className="grid grid-cols-1 gap-6">
          {payouts.map((p) => {
            const bank = p.bankDetails as unknown as BankDetails;
            const initials = getInitials(p.user.fullName);

            return (
              <div
                key={p.id}
                className="tv-surface-elevated bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-2xl p-5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all duration-300 flex flex-col xl:flex-row gap-6 justify-between items-stretch group"
              >
                {/* 1. Left side: Payout Metadata & Amount */}
                <div className="flex flex-col justify-between flex-1 space-y-4">
                  <div>
                    {/* Partner Header Row */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-emerald-500/10 shrink-0 select-none">
                        {initials}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm leading-snug">{p.user.fullName}</h3>
                        <p className="text-xs text-slate-400 select-all font-medium mt-0.5">{p.user.email}</p>
                      </div>
                    </div>

                    {/* Dynamic Status badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {p.status === "REQUESTED" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/15">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                          {t('admin.payouts.statusPending')}
                        </span>
                      ) : p.status === "PAID" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/15">
                          {"✓ " + t('admin.payouts.statusPaid')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/15">
                          {t('admin.payouts.statusRejected')}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-slate-400 bg-slate-50 border border-slate-200/40 px-2 py-0.5 rounded-lg select-none">
                        <Calendar className="w-3 h-3 text-slate-300" />
                        {new Date(p.createdAt).toLocaleString("ru-RU")}
                      </span>
                    </div>
                  </div>

                  {/* Amount Block */}
                  <div className="bg-slate-50/50 hover:bg-slate-50 rounded-2xl p-4 border border-slate-100/60 max-w-fit transition-all duration-300 select-none">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      {t('admin.payouts.amount')}
                    </p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-slate-800 font-mono tracking-tight leading-none">
                        ${p.amountUsd.toFixed(2)}
                      </span>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-500/5 px-2 py-0.5 rounded-md border border-emerald-500/10 flex items-center gap-0.5">
                        <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                        USD
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Middle side: Custom Dark Virtual Bank Card */}
                <div className="w-full xl:w-96 shrink-0 relative bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white/90 overflow-hidden shadow-md flex flex-col justify-between select-none">
                  {/* Neon radial light reflection overlay */}
                  <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-gradient-to-br from-emerald-500/15 to-teal-600/15 blur-2xl pointer-events-none" />
                  <div className="absolute -left-16 -bottom-16 w-36 h-36 rounded-full bg-gradient-to-br from-teal-500/10 to-emerald-500/10 blur-2xl pointer-events-none" />

                  {/* Bank card logo/title */}
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-teal-400" />
                      <span className="text-xs font-extrabold tracking-wider uppercase text-white/80">
                        {bank.bank || "BANK SYSTEM"}
                      </span>
                    </div>
                    {/* Simulated microchip */}
                    <div className="w-8 h-6 rounded-md bg-gradient-to-br from-amber-400/30 to-amber-600/40 border border-amber-400/20 relative">
                      <div className="absolute inset-x-2 inset-y-1.5 border-t border-b border-amber-400/20" />
                    </div>
                  </div>

                  {/* Details grid inside card */}
                  <div className="space-y-3 relative z-10 font-medium">
                    {/* Account Number */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                        {t('admin.payouts.iban')}
                      </span>
                      <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 max-w-full group/field">
                        <span className="font-mono text-xs tracking-wider truncate text-white max-w-[85%] select-all">
                          {bank.accountNumber || "—"}
                        </span>
                        {bank.accountNumber && (
                          <button
                            onClick={() => copyToClipboard(bank.accountNumber!, t('admin.payouts.accountNumber'))}
                            type="button"
                            className="p-1 hover:bg-white/10 rounded-md transition-all text-slate-400 hover:text-white cursor-pointer shrink-0"
                            title={t('admin.payouts.copy')}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* SWIFT & Beneficiary details */}
                    <div className="grid grid-cols-2 gap-4">
                      {bank.swift && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                            {t('admin.payouts.swift')}
                          </span>
                          <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 group/field">
                            <span className="font-mono text-xs text-white select-all">{bank.swift}</span>
                            <button
                              onClick={() => copyToClipboard(bank.swift!, t('admin.payouts.swiftCode'))}
                              type="button"
                              className="p-1 hover:bg-white/10 rounded-md transition-all text-slate-400 hover:text-white cursor-pointer shrink-0"
                              title={t('admin.payouts.copy')}
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      <div className={bank.swift ? "" : "col-span-2"}>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                          {t('admin.payouts.recipient')}
                        </span>
                        <div className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 truncate text-xs text-white">
                          {bank.beneficiary || "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Right side: Action Area */}
                <div className="w-full xl:w-80 shrink-0 border-t xl:border-t-0 xl:border-l border-slate-100 pt-5 xl:pt-0 xl:pl-5 flex flex-col justify-center">
                  {/* Status: Paid Ref */}
                  {p.status === "PAID" && p.externalRef && (
                    <div className="flex items-start gap-2 bg-emerald-50/50 border border-emerald-100 text-emerald-700 rounded-xl p-4 text-xs font-semibold leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-extrabold uppercase tracking-wide mr-1.5 text-emerald-800">
                          {t('admin.payouts.statusPaid')}
                        </span>
                        <div className="mt-1 flex items-center gap-1.5 font-mono text-[10px] text-slate-500 bg-white border border-slate-200/40 px-2 py-0.5 rounded-lg select-all max-w-fit">
                          <span>Ref: {p.externalRef}</span>
                          <button
                            onClick={() => copyToClipboard(p.externalRef!, "Транзакция Ref")}
                            type="button"
                            className="hover:text-slate-800 transition-colors p-0.5 cursor-pointer text-slate-400"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Status: Rejected Reason */}
                  {p.status === "REJECTED" && p.rejectReason && (
                    <div className="flex items-start gap-2 bg-rose-50/50 border border-rose-100 text-rose-700 rounded-xl p-4 text-xs font-semibold leading-relaxed">
                      <ShieldX className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-extrabold uppercase tracking-wide mr-1.5 text-rose-800">
                          {t('admin.payouts.statusRejected')}
                        </span>
                        <p className="mt-1 font-medium text-rose-600/90 italic">
                          {p.rejectReason}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Actions for Requested status */}
                  {p.status === "REQUESTED" && (
                    <div className="space-y-3.5">
                      {approving?.id === p.id ? (
                        <div className="space-y-3 animate-fade-in">
                          <Input
                            placeholder={t('admin.payouts.txIdPlaceholder')}
                            value={approving.ref}
                            onChange={(e) => setApproving({ ...approving, ref: e.target.value })}
                            className="bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white rounded-xl text-xs font-medium border-slate-200 shadow-3xs transition-all w-full h-9.5 px-3"
                          />
                          <div className="flex gap-2">
                            <Button
                              className="bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold px-4 py-2 text-xs rounded-xl shadow-xs border-0 shrink-0 transition-transform duration-100 active:scale-98 cursor-pointer"
                              onClick={() =>
                                approveM.mutate({ id: p.id, externalRef: approving.ref || undefined })
                              }
                              disabled={approveM.isPending}
                            >
                              {t('admin.payouts.confirm')}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setApproving(null)}
                              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl border-slate-200 transition-all cursor-pointer"
                            >
                              {t('admin.payouts.cancel')}
                            </Button>
                          </div>
                        </div>
                      ) : rejecting?.id === p.id ? (
                        <div className="space-y-3 animate-fade-in">
                          <textarea
                            placeholder={t('admin.payouts.rejectPlaceholder')}
                            value={rejecting.reason}
                            onChange={(e) => setRejecting({ ...rejecting, reason: e.target.value })}
                            rows={2}
                            className="flex w-full rounded-xl border border-slate-200 bg-slate-50/30 hover:bg-white hover:border-slate-300 focus:bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-hidden transition-all placeholder:text-slate-400"
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="destructive"
                              onClick={() => rejectM.mutate({ id: p.id, reason: rejecting.reason })}
                              disabled={rejectM.isPending || !rejecting.reason.trim()}
                              className="bg-gradient-to-br from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold px-4 py-2 text-xs rounded-xl shadow-xs border-0 shrink-0 transition-transform duration-100 active:scale-98 cursor-pointer"
                            >
                              {t('admin.payouts.rejectTitle')}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setRejecting(null)}
                              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl border-slate-200 transition-all cursor-pointer"
                            >
                              {t('admin.payouts.cancel')}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <Button
                            onClick={() => setApproving({ id: p.id, ref: "" })}
                            className="bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold px-4 py-2.5 text-xs rounded-xl shadow-xs hover:shadow-md hover:scale-102 duration-150 border-0 transition-transform duration-100 active:scale-98 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 mr-1.5" /> {t('admin.payouts.markPaid')}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setRejecting({ id: p.id, reason: "" })}
                            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200 hover:border-slate-300 rounded-xl transition-all hover:scale-102 duration-150 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5 mr-1.5 text-slate-400 group-hover:text-rose-500" /> {t('admin.payouts.reject')}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

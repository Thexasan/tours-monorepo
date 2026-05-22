"use client";

import { useState, useMemo } from "react";
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, KeyRound, UserMinus, UserCheck, Mail, Search, RefreshCw, Inbox, ShieldAlert } from "lucide-react";
import {
  adminPartnersApi,
  type AdminPartner,
  type CreatePartnerPayload,
} from "@/src/shared/api/admin-partners-api";
import { extractErrorMessage } from "@/src/shared/api/apiClient";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/src/components/ui/dialog";
import { useTranslations } from "next-intl";

export function AdminPartnersList() {
  const t = useTranslations('dashboard');
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "partners"],
    queryFn: () => adminPartnersApi.list(),
  });

  const resetMutation = useMutation({
    mutationFn: (id: string) => adminPartnersApi.resetPassword(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "partners"] });
      toast.success("Новый пароль отправлен на email партнёра");
    },
    onError: (e) => toast.error("Не удалось сбросить пароль", { description: extractErrorMessage(e) }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminPartnersApi.update(id, { isActive }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "partners"] });
      toast.success(vars.isActive ? "Партнёр активирован" : "Партнёр деактивирован");
    },
    onError: (e) => toast.error("Не удалось обновить статус", { description: extractErrorMessage(e) }),
  });

  // Client-side search filtering
  const filteredPartners = useMemo(() => {
    if (!data?.items) return [];
    return data.items.filter((p) => {
      return (
        p.fullName.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase()) ||
        p.referralCode.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [data, search]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* ── Page Actions ────────────────────────────────────────── */}
      <div className="flex justify-end">
        <Button
          onClick={() => setCreating(true)}
          className="bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md shadow-emerald-500/20 transition-all shrink-0 hover:scale-103 duration-150 border-0"
        >
          <Plus className="w-5 h-5 mr-1.5" /> {t('admin.partners.addPartner')}
        </Button>
      </div>

      {/* ── Toolbar Card ────────────────────────────────────────── */}
      <div className="tv-surface-elevated p-4 bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {data && (
            <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/40 select-none">
              {t('admin.partners.total')} <strong className="text-slate-800 font-bold font-mono">{filteredPartners.length}</strong>
            </div>
          )}

          <div className="relative flex-1 sm:max-w-xs sm:ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={t('admin.partners.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50/50 hover:bg-white hover:border-slate-300 focus:bg-white rounded-xl text-xs font-medium border-slate-200/60 shadow-3xs transition-all w-full"
            />
          </div>
        </div>
      </div>

      {/* ── Loading indicator ───────────────────────────────────── */}
      {isLoading && (
        <div className="tv-surface-elevated p-12 text-center text-slate-500 bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col items-center justify-center gap-3 select-none">
          <RefreshCw className="h-6 w-6 text-teal-600 animate-spin" />
          <p className="text-sm font-semibold">{t('admin.partners.loading')}</p>
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────── */}
      {!isLoading && filteredPartners.length === 0 && (
        <div className="tv-surface-elevated p-16 text-center text-slate-400 bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] select-none">
          <Inbox className="h-10 w-10 text-slate-300 mx-auto mb-3.5" />
          <p className="text-sm font-bold text-slate-800">{t('admin.partners.notFound')}</p>
          <p className="text-xs text-slate-400 mt-1">{t('admin.partners.notFoundHint')}</p>
        </div>
      )}

      {/* ── Partners Spreadsheet ────────────────────────────────── */}
      {!isLoading && filteredPartners.length > 0 && (
        <div className="tv-surface-elevated overflow-hidden bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] select-none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/70 border-b border-slate-200/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="text-left px-5 py-4 font-bold">{t('admin.partners.colPartner')}</th>
                  <th className="text-left px-5 py-4 font-bold">{t('admin.partners.colRefCode')}</th>
                  <th className="text-left px-5 py-4 font-bold">{t('admin.partners.colCommission')}</th>
                  <th className="text-left px-5 py-4 font-bold">{t('admin.partners.colBalance')}</th>
                  <th className="text-left px-5 py-4 font-bold">{t('admin.partners.colReferrals')}</th>
                  <th className="text-left px-5 py-4 font-bold">{t('admin.partners.colStatus')}</th>
                  <th className="text-right px-5 py-4 font-bold">{t('admin.partners.colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPartners.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/40 transition-colors group">
                    {/* Name & Mail */}
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-800 group-hover:text-teal-600 duration-150 text-sm leading-snug">{p.fullName}</div>
                      <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-1 font-mono select-all">
                        <Mail className="h-3 w-3 text-slate-400" /> {p.email}
                      </div>
                    </td>

                    {/* Referral code */}
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs text-slate-500 font-bold bg-slate-50 border border-slate-200/40 px-2.5 py-1 rounded-lg select-all">{p.referralCode}</span>
                    </td>

                    {/* Commission Rate */}
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center font-extrabold text-emerald-600 font-mono bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 text-xs">
                        {((p.commissionRate ?? 0.05) * 100).toFixed(0)}%
                      </span>
                    </td>

                    {/* Balance */}
                    <td className="px-5 py-3.5 text-slate-900 font-bold font-mono text-sm">${p.balance.toFixed(2)}</td>

                    {/* Referrals Count */}
                    <td className="px-5 py-3.5 font-bold text-slate-600 font-mono text-xs">{p.referralsCount ?? 0} {t('admin.partners.persons')}</td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      {p.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/15">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-subtle" />
                          {t('admin.partners.statusActive')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/15">
                          {t('admin.partners.statusInactive')}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            if (confirm(t('admin.partners.resetPasswordConfirm', { email: p.email }))) {
                              resetMutation.mutate(p.id);
                            }
                          }}
                          title={t('admin.partners.resetPassword')}
                          className="p-2 bg-slate-50 hover:bg-amber-50 text-slate-500 hover:text-amber-600 rounded-xl border border-slate-200/30 hover:border-amber-200/40 transition-all hover:scale-105 duration-150 cursor-pointer"
                        >
                          <KeyRound className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => toggleMutation.mutate({ id: p.id, isActive: !p.isActive })}
                          title={p.isActive ? t('admin.partners.deactivate') : t('admin.partners.activate')}
                          className={`p-2 bg-slate-50 rounded-xl border border-slate-200/30 transition-all hover:scale-105 duration-150 cursor-pointer ${
                            p.isActive
                              ? "hover:bg-rose-50 text-slate-500 hover:text-rose-600 hover:border-rose-200/40"
                              : "hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 hover:border-emerald-200/40"
                          }`}
                        >
                          {p.isActive ? <UserMinus className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {creating && <CreatePartnerModal onClose={() => setCreating(false)} />}
    </div>
  );
}

function CreatePartnerModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations('dashboard');
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [commissionRate, setCommissionRate] = useState("5");
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (payload: CreatePartnerPayload) => adminPartnersApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "partners"] });
      toast.success("Партнёр создан, временный пароль отправлен на email");
      onClose();
    },
    onError: (err) => {
      const msg = extractErrorMessage(err);
      setError(msg);
      toast.error("Не удалось создать партнёра", { description: msg });
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const rateNum = parseFloat(commissionRate);
    createMutation.mutate({
      email: email.trim(),
      fullName: fullName.trim(),
      phone: phone.trim() || undefined,
      commissionRate: !isNaN(rateNum) ? rateNum / 100 : undefined,
    });
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md bg-white rounded-3xl border border-slate-200 p-6 select-none animate-fade-in-up">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-lg font-bold text-slate-900">{t('admin.partners.modalTitle')}</DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-1">
            {t('admin.partners.modalDesc')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="p-email" className="text-xs font-bold text-slate-600">{t('admin.partners.emailLabel')}</Label>
            <Input
              id="p-email" type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('admin.partners.emailPlaceholder')}
              className="bg-slate-50 border-slate-200/60 rounded-xl focus:bg-white text-xs font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="p-name" className="text-xs font-bold text-slate-600">{t('admin.partners.nameLabel')}</Label>
            <Input
              id="p-name" required value={fullName} minLength={2}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t('admin.partners.namePlaceholder')}
              className="bg-slate-50 border-slate-200/60 rounded-xl focus:bg-white text-xs font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="p-phone" className="text-xs font-bold text-slate-600">{t('admin.partners.phoneLabel')}</Label>
            <Input
              id="p-phone" value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('admin.partners.phonePlaceholder')}
              className="bg-slate-50 border-slate-200/60 rounded-xl focus:bg-white text-xs font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="p-rate" className="text-xs font-bold text-slate-600">{t('admin.partners.commissionLabel')}</Label>
            <Input
              id="p-rate" type="number" min="1" max="100" step="0.5"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              placeholder="5"
              className="bg-slate-50 border-slate-200/60 rounded-xl focus:bg-white text-xs font-medium"
            />
            <p className="text-[10px] text-slate-400 leading-snug">
              {t('admin.partners.commissionHint')}
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-bold select-text">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <DialogFooter className="flex gap-2 pt-4 border-t border-slate-100 mt-5">
            <Button
              type="button" variant="outline" onClick={onClose}
              className="rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
            >
              {t('admin.partners.cancel')}
            </Button>
            <Button
              type="submit" disabled={createMutation.isPending}
              className="bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer border-0"
            >
              {createMutation.isPending ? t('admin.partners.creating') : t('admin.partners.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

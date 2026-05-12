"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, KeyRound, UserMinus, UserCheck, Mail } from "lucide-react";
import {
  adminPartnersApi,
  type AdminPartner,
  type CreatePartnerPayload,
} from "@/src/shared/api/admin-partners-api";
import { extractErrorMessage } from "@/src/shared/api/apiClient";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/src/components/ui/dialog";

export function AdminPartnersList() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "partners"],
    queryFn: () => adminPartnersApi.list(),
  });

  const resetMutation = useMutation({
    mutationFn: (id: string) => adminPartnersApi.resetPassword(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "partners"] }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminPartnersApi.update(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "partners"] }),
  });

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-600">
          {data ? `${data.total} ${pluralize(data.total, "партнёр", "партнёра", "партнёров")}` : "Загрузка..."}
        </p>
        <Button onClick={() => setCreating(true)}>
          <Plus className="w-4 h-4 mr-2" /> Добавить партнёра
        </Button>
      </div>

      <div className="tv-surface-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Партнёр</th>
                <th className="text-left px-4 py-3 font-semibold">Реф-код</th>
                <th className="text-left px-4 py-3 font-semibold">Баланс</th>
                <th className="text-left px-4 py-3 font-semibold">Рефералы</th>
                <th className="text-left px-4 py-3 font-semibold">Статус</th>
                <th className="text-right px-4 py-3 font-semibold">Действия</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Загрузка...</td></tr>
              )}
              {data && data.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    Партнёров пока нет. Нажмите «Добавить партнёра», чтобы создать первого.
                  </td>
                </tr>
              )}
              {data?.items.map((p) => (
                <PartnerRow
                  key={p.id}
                  partner={p}
                  onResetPassword={() => {
                    if (confirm(`Сбросить пароль партнёру ${p.email}? Новый временный пароль уйдёт ему на email.`)) {
                      resetMutation.mutate(p.id);
                    }
                  }}
                  onToggleActive={() =>
                    toggleMutation.mutate({ id: p.id, isActive: !p.isActive })
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {creating && <CreatePartnerModal onClose={() => setCreating(false)} />}
    </>
  );
}

function PartnerRow({
  partner, onResetPassword, onToggleActive,
}: {
  partner: AdminPartner;
  onResetPassword: () => void;
  onToggleActive: () => void;
}) {
  return (
    <tr className="border-t border-slate-100 hover:bg-slate-50/50">
      <td className="px-4 py-3">
        <div className="font-medium text-slate-900">{partner.fullName}</div>
        <div className="text-xs text-slate-500 flex items-center gap-1">
          <Mail className="h-3 w-3" /> {partner.email}
        </div>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-slate-700">{partner.referralCode}</td>
      <td className="px-4 py-3 tabular-nums">${partner.balance.toFixed(2)}</td>
      <td className="px-4 py-3 tabular-nums">{partner.referralsCount ?? 0}</td>
      <td className="px-4 py-3">
        {partner.isActive ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            Активен
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            Деактивирован
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="inline-flex gap-1">
          <button
            onClick={onResetPassword}
            title="Сбросить пароль (отправит новый на email)"
            className="p-2 rounded-lg hover:bg-amber-50 text-amber-700 transition-colors"
          >
            <KeyRound className="h-4 w-4" />
          </button>
          <button
            onClick={onToggleActive}
            title={partner.isActive ? "Деактивировать" : "Активировать"}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
          >
            {partner.isActive ? <UserMinus className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
          </button>
        </div>
      </td>
    </tr>
  );
}

function CreatePartnerModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (payload: CreatePartnerPayload) => adminPartnersApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "partners"] });
      onClose();
    },
    onError: (err) => setError(extractErrorMessage(err)),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    createMutation.mutate({
      email: email.trim(),
      fullName: fullName.trim(),
      phone: phone.trim() || undefined,
    });
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Добавить партнёра</DialogTitle>
          <DialogDescription>
            Партнёр получит на email временный пароль для входа. После входа он сменит пароль в личном кабинете.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="p-email">Email</Label>
            <Input
              id="p-email" type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="blogger@example.com"
            />
          </div>
          <div>
            <Label htmlFor="p-name">Полное имя</Label>
            <Input
              id="p-name" required value={fullName} minLength={2}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Иван Петров"
            />
          </div>
          <div>
            <Label htmlFor="p-phone">Телефон (опционально)</Label>
            <Input
              id="p-phone" value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+992900000000"
            />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Отмена</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Создание..." : "Создать партнёра"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function pluralize(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthStore } from "@/src/shared/store/auth-store";
import { apiClient, extractErrorMessage } from "@/src/shared/api/apiClient";
import { authApi } from "@/src/shared/api/auth-api";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";

const schema = z.object({
  fullName: z.string().min(2).max(100),
  phone: z.string().regex(/^\+?[0-9\s\-()]{6,20}$/, "Некорректный телефон").optional().or(z.literal("")),
  avatarUrl: z.string().url("Некорректный URL").optional().or(z.literal("")),
});
type Values = z.infer<typeof schema>;

export function ProfileForm() {
  const { user, setUser } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register, handleSubmit, reset, formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", phone: "", avatarUrl: "" },
  });

  useEffect(() => {
    if (user) {
      reset({
        fullName: user.fullName,
        phone: "",
        avatarUrl: user.avatarUrl ?? "",
      });
    }
  }, [user, reset]);

  const onSubmit = async (values: Values) => {
    setSaving(true); setError(null); setSuccess(false);
    try {
      await apiClient.patch("/users/me", {
        fullName: values.fullName,
        phone: values.phone || undefined,
        avatarUrl: values.avatarUrl || undefined,
      });
      const fresh = await authApi.me();
      setUser(fresh);
      setSuccess(true);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-zinc-200 p-6 max-w-xl flex flex-col gap-4">
      <div>
        <Label>Email</Label>
        <Input value={user.email} disabled />
      </div>

      <div>
        <Label htmlFor="fullName">Имя и фамилия</Label>
        <Input id="fullName" {...register("fullName")} />
        {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>}
      </div>

      <div>
        <Label htmlFor="phone">Телефон</Label>
        <Input id="phone" type="tel" placeholder="+998..." {...register("phone")} />
        {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
      </div>

      <div>
        <Label htmlFor="avatarUrl">URL аватара</Label>
        <Input id="avatarUrl" type="url" placeholder="https://..." {...register("avatarUrl")} />
        {errors.avatarUrl && <p className="mt-1 text-xs text-red-600">{errors.avatarUrl.message}</p>}
      </div>

      <div className="rounded-md bg-zinc-50 border border-zinc-200 p-3 text-sm">
        <p className="text-zinc-600">Реферальный код:</p>
        <p className="font-mono font-semibold text-zinc-900">{user.referralCode}</p>
      </div>

      {success && (
        <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700">
          Профиль сохранён.
        </div>
      )}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Button type="submit" disabled={saving}>
        {saving ? "Сохраняем..." : "Сохранить"}
      </Button>
    </form>
  );
}

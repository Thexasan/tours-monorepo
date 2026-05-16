"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Check, AlertCircle, Copy, Loader2, Sparkles, UserCircle2, Camera } from "lucide-react";
import { useAuthStore } from "@/src/shared/store/auth-store";
import { apiClient, extractErrorMessage } from "@/src/shared/api/apiClient";
import { authApi } from "@/src/shared/api/auth-api";
import { uploadImage } from "@/src/shared/api/upload-api";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";

const schema = z.object({
  fullName:  z.string().min(2).max(100),
  phone:     z.string().regex(/^\+?[0-9\s\-()]{6,20}$/, "Некорректный телефон").optional().or(z.literal("")),
  avatarUrl: z.string().optional().or(z.literal("")),
});
type Values = z.infer<typeof schema>;

// ── Avatar Uploader ──────────────────────────────────────────────────────────
function AvatarUploader({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploadError(null);
    setUploading(true);
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch {
      setUploadError("Ошибка загрузки. Попробуйте ещё раз.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-100 hover:border-teal-400 transition shrink-0 group"
        aria-label="Загрузить аватар"
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Аватар" className="w-full h-full object-cover" />
        ) : (
          <UserCircle2 className="h-10 w-10 text-slate-400 m-auto" />
        )}

        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition">
          {uploading
            ? <Loader2 className="h-5 w-5 animate-spin text-white" />
            : <Camera className="h-5 w-5 text-white" />
          }
        </div>
      </button>

      <div className="flex flex-col gap-1.5">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Загружаем…" : "Загрузить фото"}
        </Button>

        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs text-slate-500 hover:text-red-600 text-left transition"
          >
            Удалить фото
          </button>
        )}

        <p className="text-xs text-slate-400">JPG, PNG, WebP · до 5 МБ</p>
        {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export function ProfileForm() {
  const { user, setUser } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register, handleSubmit, reset, control, formState: { errors },
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

  const onCopyRefCode = () => {
    if (!user?.referralCode) return;
    void navigator.clipboard.writeText(user.referralCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  if (!user) return null;

  const isAdmin = user.role === "ADMIN";

  return (
    <div className={`grid grid-cols-1 ${!isAdmin ? "xl:grid-cols-[1fr_320px]" : ""} gap-6 items-start`}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="tv-surface-elevated p-6 md:p-8 flex flex-col gap-5"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Личные данные</h2>
            <p className="text-sm text-slate-500">Email привязан к аккаунту и не редактируется.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user.email} disabled />
          </div>

          <div>
            <Label htmlFor="fullName">Имя и фамилия</Label>
            <Input id="fullName" {...register("fullName")} />
            {errors.fullName && (
              <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">Телефон</Label>
            <Input id="phone" type="tel" placeholder="+998..." {...register("phone")} />
            {errors.phone && (
              <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.phone.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <Label>Фото профиля</Label>
            <div className="mt-1.5">
              <Controller
                name="avatarUrl"
                control={control}
                render={({ field }) => (
                  <AvatarUploader value={field.value ?? ""} onChange={field.onChange} />
                )}
              />
            </div>
          </div>
        </div>

        {success && (
          <div className="flex items-start gap-2 rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-sm text-emerald-800">
            <Check className="h-4 w-4 mt-0.5 shrink-0" />
            <p>Профиль сохранён. Изменения уже видны.</p>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-100 p-3 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <Button type="submit" disabled={saving} size="lg">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Сохраняем..." : "Сохранить изменения"}
          </Button>
        </div>
      </form>

      {/* Sidebar — referral code (hidden for ADMIN) */}
      {!isAdmin && <aside className="tv-surface-elevated p-6 relative overflow-hidden">
        <div
          className="absolute inset-x-0 top-0 h-24 -z-0 opacity-90"
          style={{ background: "var(--gradient-amber)" }}
          aria-hidden
        />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
            <Sparkles className="h-3 w-3" /> Реферальный код
          </div>
          <p className="mt-3 text-white/90 text-xs">Делитесь кодом — друг получит скидку, вы — бонусы.</p>

          <div className="mt-4 rounded-2xl bg-white border border-amber-200 p-3 flex items-center justify-between gap-2 shadow-sm">
            <p className="font-mono font-bold text-amber-700 text-lg tracking-wider truncate">
              {user.referralCode}
            </p>
            <button
              type="button"
              onClick={onCopyRefCode}
              className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 px-2 py-1 rounded-md hover:bg-amber-50"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Скопировано
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Копировать
                </>
              )}
            </button>
          </div>
        </div>
      </aside>}
    </div>
  );
}

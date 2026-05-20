"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Check, AlertCircle, Copy, Loader2, Sparkles, UserCircle2, Camera } from "lucide-react";
import { useAuthStore } from "@/src/shared/store/auth-store";
import { apiClient, extractErrorMessage } from "@/src/shared/api/apiClient";
import { toast } from "sonner";
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
    <div className="flex items-center gap-5 p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100/50 border border-slate-200/50 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="relative h-20 w-20 rounded-full overflow-hidden border-4 border-white shadow-md bg-slate-100 hover:border-teal-500/80 transition-all duration-300 shrink-0 group"
        aria-label="Загрузить аватар"
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Аватар" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <UserCircle2 className="h-10 w-10 text-slate-400 m-auto" />
        )}

        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
          className="rounded-xl font-bold text-xs hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 transition-all duration-300"
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Загружаем…" : "Выбрать фото"}
        </Button>

        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-[11px] font-bold text-slate-400 hover:text-rose-600 text-left transition-colors pl-1"
          >
            Удалить фото
          </button>
        )}

        <p className="text-[10px] pl-1 text-slate-400 font-medium">JPG, PNG, WebP · до 5 МБ</p>
        {uploadError && <p className="text-xs text-red-500 pl-1">{uploadError}</p>}
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
    setSaving(true);
    try {
      await apiClient.patch("/users/me", {
        fullName: values.fullName,
        phone: values.phone || undefined,
        avatarUrl: values.avatarUrl || undefined,
      });
      const fresh = await authApi.me();
      setUser(fresh);
      toast.success("Профиль сохранён");
    } catch (e) {
      toast.error("Не удалось сохранить", { description: extractErrorMessage(e) });
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
    <div className={`grid grid-cols-1 ${!isAdmin ? "xl:grid-cols-[1fr_340px]" : ""} gap-6 items-start`}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="tv-surface-elevated p-6 md:p-8 flex flex-col gap-6 rounded-3xl border border-slate-100 shadow-sm bg-gradient-to-b from-white to-slate-50/30"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Личные данные</h2>
            <p className="text-xs text-slate-400 mt-1 font-medium">Email привязан к аккаунту и не редактируется.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email</Label>
            <Input id="email" value={user.email} disabled className="rounded-xl border-slate-200 bg-slate-50 font-medium text-slate-500 cursor-not-allowed" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-xs font-bold text-slate-500 uppercase tracking-wide">Имя и фамилия</Label>
            <Input id="fullName" {...register("fullName")} className="rounded-xl border-slate-200 focus-visible:ring-teal-500 focus-visible:border-teal-500 transition-all font-medium text-slate-800" />
            {errors.fullName && (
              <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-semibold">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs font-bold text-slate-500 uppercase tracking-wide">Телефон</Label>
            <Input id="phone" type="tel" placeholder="+998..." {...register("phone")} className="rounded-xl border-slate-200 focus-visible:ring-teal-500 focus-visible:border-teal-500 transition-all font-medium text-slate-800" />
            {errors.phone && (
              <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-semibold">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.phone.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Фото профиля</Label>
            <div className="mt-1">
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

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="submit" disabled={saving} size="lg" className="rounded-2xl font-bold text-sm bg-teal-600 hover:bg-teal-700 transition-all duration-300 shadow-md hover:shadow-lg active:scale-95">
            {saving && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
            {saving ? "Сохраняем данные…" : "Сохранить изменения"}
          </Button>
        </div>
      </form>

      {/* Sidebar — referral code (hidden for ADMIN) */}
      {!isAdmin && (
        <aside className="relative overflow-hidden rounded-3xl border border-teal-500/20 p-6 shadow-xl shadow-teal-500/5 bg-gradient-to-b from-white to-teal-500/[0.02]">
          <div
            className="absolute inset-x-0 top-0 h-32 -z-0 opacity-90 bg-gradient-to-br from-emerald-600 to-teal-800"
            aria-hidden
          />
          {/* Glow overlays */}
          <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/25 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white">
              <Sparkles className="h-3 w-3 animate-pulse text-teal-200" /> Реферальный бонус
            </div>
            <p className="mt-4 text-white text-sm font-semibold leading-relaxed">
              Делитесь кодом с друзьями: они получат скидку на первый тур, а вы накопите бонусы на бесплатное путешествие!
            </p>

            <div className="mt-6 rounded-2xl bg-white border border-teal-200/60 p-4 flex items-center justify-between gap-3 shadow-md">
              <p className="font-mono font-extrabold text-teal-600 text-xl tracking-widest truncate">
                {user.referralCode}
              </p>
              <button
                type="button"
                onClick={onCopyRefCode}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:text-teal-700 px-3 py-2 rounded-xl hover:bg-teal-50 border border-transparent hover:border-teal-100 transition-all duration-300 shadow-sm shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-emerald-600">Скопировано</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Копировать</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}

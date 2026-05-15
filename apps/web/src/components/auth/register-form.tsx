"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { Mail, ArrowRight, RefreshCw, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { authApi } from "@/src/shared/api/auth-api";
import { getRoleHome } from "@/src/shared/hooks/role-routes";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { extractErrorMessage } from "@/src/shared/api/apiClient";

// ── 6-box OTP Input ────────────────────────────────────────────────────────
function OtpBoxes({
  value, onChange, autoFocus,
}: { value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  function handleChange(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw === "") {
      onChange(value.slice(0, i) + value.slice(i + 1));
      return;
    }
    const digit = raw.slice(-1);
    const arr = (value + "      ").slice(0, 6).split("");
    arr[i] = digit;
    const newVal = arr.join("").trimEnd();
    onChange(newVal);
    if (i < 5) refs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !value[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (digits) {
      onChange(digits);
      refs.current[Math.min(digits.length, 5)]?.focus();
    }
  }

  return (
    <div className="flex justify-center gap-2" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={2}
          value={value[i] ?? ""}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKeyDown(i, e)}
          onFocus={e => e.target.select()}
          className="w-11 h-14 text-center text-2xl font-bold rounded-xl border-2 border-slate-200 bg-slate-50 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/15 outline-none transition-all"
        />
      ))}
    </div>
  );
}

const OTP_COOLDOWN = 60; // seconds

const emailSchema = z.object({
  email: z.string().email("Некорректный email"),
});

const detailsSchema = z.object({
  fullName: z.string().min(2, "Имя минимум 2 символа").max(100),
  phone: z.string().regex(/^\+?[0-9\s\-()]{6,20}$/, "Некорректный телефон").optional().or(z.literal("")),
  password: z.string().min(8, "Минимум 8 символов"),
  referralCode: z.string().optional().or(z.literal("")),
});

type EmailValues = z.infer<typeof emailSchema>;
type DetailsValues = z.infer<typeof detailsSchema>;

function readReferralCookie(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(/(?:^|;\s*)tours_ref=([A-Z0-9]+)/);
  return match?.[1];
}

export function RegisterForm() {
  const { register: registerUser, isLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();

  const prefillEmail = searchParams?.get("email") ?? "";
  const prefillName = searchParams?.get("name") ?? "";
  const prefillPhone = searchParams?.get("phone") ?? "";
  const hasGuestBooking = Boolean(searchParams?.get("bookingId"));

  // Step: "email" → "otp" → "details"
  const [step, setStep] = useState<"email" | "otp" | "details">("email");
  const [confirmedEmail, setConfirmedEmail] = useState(prefillEmail);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [devCode, setDevCode] = useState<string | undefined>();
  const [serverError, setServerError] = useState<string | null>(null);
  const [refFromCookie, setRefFromCookie] = useState<string | undefined>();
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: prefillEmail },
  });

  const detailsForm = useForm<DetailsValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues: { fullName: prefillName, phone: prefillPhone, password: "", referralCode: "" },
  });

  useEffect(() => {
    const code = readReferralCookie();
    if (code) {
      setRefFromCookie(code);
      detailsForm.setValue("referralCode", code);
    }
  }, [detailsForm]);

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  function startCooldown() {
    setCooldown(OTP_COOLDOWN);
    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleSendOtp(email: string) {
    setSendingOtp(true);
    setOtpError(null);
    try {
      const result = await authApi.sendOtp(email);
      setDevCode(result.devCode);
      setConfirmedEmail(email);
      setStep("otp");
      startCooldown();
    } catch (e) {
      emailForm.setError("email", { message: extractErrorMessage(e) });
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleResendOtp() {
    if (cooldown > 0) return;
    setSendingOtp(true);
    setOtpError(null);
    try {
      const result = await authApi.sendOtp(confirmedEmail);
      setDevCode(result.devCode);
      startCooldown();
      setOtp("");
    } catch (e) {
      setOtpError(extractErrorMessage(e));
    } finally {
      setSendingOtp(false);
    }
  }

  function handleOtpChange(val: string) {
    const digits = val.replace(/\D/g, "").slice(0, 6);
    setOtp(digits);
    setOtpError(null);
    if (digits.length === 6) {
      setStep("details");
    }
  }

  async function handleRegister(values: DetailsValues) {
    if (otp.length !== 6) {
      setStep("otp");
      return;
    }
    setServerError(null);
    try {
      const u = await registerUser({
        email: confirmedEmail,
        otp,
        password: values.password,
        fullName: values.fullName,
        phone: values.phone || undefined,
        referralCode: values.referralCode || undefined,
      });
      const target = hasGuestBooking
        ? `/${locale}/dashboard/trips`
        : getRoleHome(u.role, locale);
      router.push(target);
      router.refresh();
    } catch (e) {
      setServerError(extractErrorMessage(e));
    }
  }

  // ── Step 1: Email ──────────────────────────────────────────────────────────
  if (step === "email") {
    return (
      <form
        onSubmit={emailForm.handleSubmit(v => handleSendOtp(v.email))}
        className="flex flex-col gap-4"
      >
        {hasGuestBooking && (
          <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800">
            У вас уже есть гостевая заявка. После регистрации она появится в вашем кабинете.
          </div>
        )}

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            {...emailForm.register("email")}
          />
          {emailForm.formState.errors.email && (
            <p className="mt-1 text-sm text-red-600">{emailForm.formState.errors.email.message}</p>
          )}
        </div>

        <Button type="submit" disabled={sendingOtp} className="mt-2">
          {sendingOtp ? "Отправляем код…" : (
            <span className="flex items-center gap-2">
              Получить код подтверждения <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>

        <p className="text-center text-sm text-slate-500">
          Мы отправим 6-значный код на ваш email для подтверждения
        </p>
      </form>
    );
  }

  // ── Step 2: OTP ────────────────────────────────────────────────────────────
  if (step === "otp") {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3 rounded-xl bg-teal-50 border border-teal-100 p-4">
          <div className="grid place-items-center h-10 w-10 rounded-xl bg-teal-600 text-white shrink-0">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Код отправлен</p>
            <p className="text-xs text-slate-500">на <strong>{confirmedEmail}</strong></p>
          </div>
        </div>

        {devCode && (
          <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-2">
              ⚠ Dev-режим — SMTP не настроен
            </p>
            <p className="text-3xl font-bold tracking-[0.25em] text-amber-900 select-all">{devCode}</p>
            <p className="text-xs text-amber-600 mt-1.5">Скопируй этот код и введи ниже</p>
          </div>
        )}

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Введите 6-значный код
          </p>
          <OtpBoxes value={otp} onChange={handleOtpChange} autoFocus />
          <p className="mt-2 text-center text-xs text-slate-400">
            {devCode ? "Скопируй код выше и вставь сюда (Ctrl+V)" : "Код действителен 10 минут · Можно вставить из буфера обмена"}
          </p>
        </div>

        {otpError && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {otpError}
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => { setStep("email"); setOtp(""); }}
            className="text-slate-500 hover:text-slate-700 underline underline-offset-2"
          >
            Изменить email
          </button>
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={cooldown > 0 || sendingOtp}
            className="flex items-center gap-1 text-teal-600 hover:text-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {cooldown > 0 ? `Отправить снова (${cooldown}с)` : "Отправить снова"}
          </button>
        </div>
      </div>
    );
  }

  // ── Step 3: Details ────────────────────────────────────────────────────────
  return (
    <form onSubmit={detailsForm.handleSubmit(handleRegister)} className="flex flex-col gap-4">
      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
        <p className="text-sm text-emerald-800">
          Email подтверждён: <strong>{confirmedEmail}</strong>
        </p>
      </div>

      <div>
        <Label htmlFor="fullName">Имя и фамилия</Label>
        <Input id="fullName" autoComplete="name" autoFocus {...detailsForm.register("fullName")} />
        {detailsForm.formState.errors.fullName && (
          <p className="mt-1 text-sm text-red-600">{detailsForm.formState.errors.fullName.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="phone">Телефон (опционально)</Label>
        <Input id="phone" type="tel" autoComplete="tel" placeholder="+998…" {...detailsForm.register("phone")} />
        {detailsForm.formState.errors.phone && (
          <p className="mt-1 text-sm text-red-600">{detailsForm.formState.errors.phone.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="password">Пароль</Label>
        <Input id="password" type="password" autoComplete="new-password" {...detailsForm.register("password")} />
        {detailsForm.formState.errors.password && (
          <p className="mt-1 text-sm text-red-600">{detailsForm.formState.errors.password.message}</p>
        )}
      </div>

      {refFromCookie && (
        <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">
          Вы пришли по реферальной ссылке: <strong>{refFromCookie}</strong>
        </div>
      )}

      {serverError && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <Button type="submit" disabled={isLoading} className="mt-2">
        {isLoading ? "Создаём аккаунт…" : "Зарегистрироваться"}
      </Button>
    </form>
  );
}

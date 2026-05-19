"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Mail, ArrowRight, RefreshCw, CheckCircle2, Check } from "lucide-react";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { authApi } from "@/src/shared/api/auth-api";
import { getRoleHome } from "@/src/shared/hooks/role-routes";
import { BOOKING_INTENT_KEY, type BookingIntent } from "@/src/components/bookings/booking-modal";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { extractErrorMessage } from "@/src/shared/api/apiClient";

// ── Step Indicator ──────────────────────────────────────────────────────────
const STEP_IDS = ["email", "otp", "details"] as const;
const STEP_INDEX: Record<string, number> = { email: 0, otp: 1, details: 2 };

function StepIndicator({ current, labels }: { current: "email" | "otp" | "details"; labels: [string, string, string] }) {
  const currentIdx = STEP_INDEX[current] ?? 0;
  const steps = STEP_IDS.map((id, i) => ({ id, label: labels[i] }));
  return (
    <div className="flex items-start">
      {steps.map((s, i) => {
        const done   = i < currentIdx;
        const active = i === currentIdx;
        return (
          <Fragment key={s.id}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                  done
                    ? "bg-orange-600 border-orange-600 text-white"
                    : active
                    ? "bg-white border-orange-600 text-orange-700"
                    : "bg-white border-slate-200 text-slate-400"
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={`text-xs font-medium whitespace-nowrap ${
                  active ? "text-orange-700" : done ? "text-slate-600" : "text-slate-400"
                }`}
              >
                {s.label}
              </span>
            </div>

            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mt-4 mx-2 transition-colors ${
                  done ? "bg-orange-500" : "bg-slate-200"
                }`}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

// ── 6-box OTP Input ────────────────────────────────────────────────────────
function OtpBoxes({
  value, onChange, onComplete, autoFocus,
}: { value: string; onChange: (v: string) => void; onComplete?: () => void; autoFocus?: boolean }) {
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
    if (e.key === "Backspace" && !value[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowLeft"  && i > 0)             refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5)             refs.current[i + 1]?.focus();
    if (e.key === "Enter" && value.length === 6)     onComplete?.();
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
          className="w-11 h-14 text-center text-2xl font-bold rounded-xl border-2 border-slate-200 bg-slate-50 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/15 outline-none transition-all"
        />
      ))}
    </div>
  );
}

const OTP_COOLDOWN = 60;

type EmailValues   = { email: string };
type DetailsValues = { fullName: string; phone?: string; password: string; referralCode?: string };

function readReferralCookie(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(/(?:^|;\s*)tours_ref=([A-Z0-9]+)/);
  return match?.[1];
}

export function RegisterForm() {
  const t = useTranslations("auth");
  const { register: registerUser, isLoading } = useAuth();
  const router       = useRouter();
  const locale       = useLocale();
  const searchParams = useSearchParams();

  const emailSchema = z.object({
    email: z.string().email(t("register.validEmail")),
  });
  const detailsSchema = z.object({
    fullName:     z.string().min(2, t("register.validName")).max(100),
    phone:        z.string().regex(/^\+?[0-9\s\-()]{6,20}$/, t("register.validPhone")).optional().or(z.literal("")),
    password:     z.string().min(8, t("register.validPassword")),
    referralCode: z.string().optional().or(z.literal("")),
  });

  const prefillEmail    = searchParams?.get("email") ?? "";
  const prefillName     = searchParams?.get("name")  ?? "";
  const prefillPhone    = searchParams?.get("phone") ?? "";
  const hasGuestBooking = Boolean(searchParams?.get("bookingId"));

  const [step,           setStep]           = useState<"email" | "otp" | "details">("email");
  const [confirmedEmail, setConfirmedEmail] = useState(prefillEmail);
  const [otp,            setOtp]            = useState("");
  const [otpError,       setOtpError]       = useState<string | null>(null);
  const [sendingOtp,     setSendingOtp]     = useState(false);
  const [verifyingOtp,   setVerifyingOtp]   = useState(false);
  const [cooldown,       setCooldown]       = useState(0);
  const [devCode,        setDevCode]        = useState<string | undefined>();
  const [serverError,    setServerError]    = useState<string | null>(null);
  const [refFromCookie,  setRefFromCookie]  = useState<string | undefined>();
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
    setOtp(val.replace(/\D/g, "").slice(0, 6));
    setOtpError(null);
  }

  async function handleOtpContinue() {
    if (otp.length !== 6) {
      setOtpError(t("register.validOtp"));
      return;
    }
    setVerifyingOtp(true);
    setOtpError(null);
    try {
      await authApi.verifyOtp(confirmedEmail, otp);
      setStep("details");
    } catch (e) {
      setOtpError(extractErrorMessage(e));
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function handleRegister(values: DetailsValues) {
    if (otp.length !== 6) { setStep("otp"); return; }
    setServerError(null);
    try {
      const u = await registerUser({
        email:        confirmedEmail,
        otp,
        password:     values.password,
        fullName:     values.fullName,
        phone:        values.phone        || undefined,
        referralCode: values.referralCode || undefined,
      });
      let target: string;
      try {
        const raw = sessionStorage.getItem(BOOKING_INTENT_KEY);
        if (raw) {
          const intent: BookingIntent = JSON.parse(raw);
          // Keep intent in sessionStorage — BookingModal will read and clear it on open
          target = `/${intent.locale}/tours/${intent.tourSlug}?book=1`;
        } else {
          target = hasGuestBooking ? `/${locale}/dashboard/trips` : getRoleHome(u.role, locale);
        }
      } catch {
        target = hasGuestBooking ? `/${locale}/dashboard/trips` : getRoleHome(u.role, locale);
      }
      router.push(target);
      router.refresh();
    } catch (e) {
      setServerError(extractErrorMessage(e));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <StepIndicator current={step} labels={[t("register.stepEmail"), t("register.stepOtp"), t("register.stepDetails")]} />

      {/* ── Шаг 1: Email ─────────────────────────────────────────────────── */}
      {step === "email" && (
        <form
          onSubmit={emailForm.handleSubmit(v => handleSendOtp(v.email))}
          className="flex flex-col gap-4"
        >
          {hasGuestBooking && (
            <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800">
              {t("register.guestBookingNotice")}
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
            {sendingOtp ? t("register.sendingCode") : (
              <span className="flex items-center gap-2">
                {t("register.sendCode")} <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>

          <p className="text-center text-sm text-slate-500">
            {t("register.codeHint")}
          </p>
        </form>
      )}

      {/* ── Шаг 2: OTP ───────────────────────────────────────────────────── */}
      {step === "otp" && (
        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => { e.preventDefault(); handleOtpContinue(); }}
        >
          <div className="flex items-center gap-3 rounded-xl bg-orange-50 border border-orange-100 p-4">
            <div className="grid place-items-center h-10 w-10 rounded-xl bg-orange-600 text-white shrink-0">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{t("register.codeSent")}</p>
              <p className="text-xs text-slate-500">{t("register.codeSentTo")} <strong>{confirmedEmail}</strong></p>
            </div>
          </div>

          {devCode && (
            <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 p-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-2">
                {t("register.devMode")}
              </p>
              <p className="text-3xl font-bold tracking-[0.25em] text-amber-900 select-all">{devCode}</p>
              <p className="text-xs text-amber-600 mt-1.5">{t("register.devCodeHint")}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              {t("register.enterCode")}
            </p>
            <OtpBoxes value={otp} onChange={handleOtpChange} onComplete={handleOtpContinue} autoFocus />
            <p className="mt-2 text-center text-xs text-slate-400">
              {devCode ? t("register.devCodePaste") : t("register.codeExpiry")}
            </p>
          </div>

          {otpError && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {otpError}
            </div>
          )}

          <Button
            type="submit"
            disabled={otp.length !== 6 || verifyingOtp}
            className="w-full"
          >
            {verifyingOtp ? (
              t("register.verifying")
            ) : (
              <span className="flex items-center gap-2">
                {t("register.verifyCode")} <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => { setStep("email"); setOtp(""); setOtpError(null); }}
              className="text-slate-500 hover:text-slate-700 underline underline-offset-2"
            >
              {t("register.changeEmail")}
            </button>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={cooldown > 0 || sendingOtp}
              className="flex items-center gap-1 text-orange-600 hover:text-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {cooldown > 0 ? `${t("register.resend")} (${cooldown}с)` : t("register.resend")}
            </button>
          </div>
        </form>
      )}

      {/* ── Шаг 3: Данные профиля ────────────────────────────────────────── */}
      {step === "details" && (
        <form onSubmit={detailsForm.handleSubmit(handleRegister)} className="flex flex-col gap-4">
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <p className="text-sm text-emerald-800">
              {t("register.emailConfirmed")} <strong>{confirmedEmail}</strong>
            </p>
          </div>

          <div>
            <Label htmlFor="fullName">{t("register.nameLabel")}</Label>
            <Input id="fullName" autoComplete="name" autoFocus {...detailsForm.register("fullName")} />
            {detailsForm.formState.errors.fullName && (
              <p className="mt-1 text-sm text-red-600">{detailsForm.formState.errors.fullName.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">{t("register.phoneLabel")}</Label>
            <Input id="phone" type="tel" autoComplete="tel" placeholder="+998…" {...detailsForm.register("phone")} />
            {detailsForm.formState.errors.phone && (
              <p className="mt-1 text-sm text-red-600">{detailsForm.formState.errors.phone.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password">{t("register.passwordLabel")}</Label>
            <Input id="password" type="password" autoComplete="new-password" {...detailsForm.register("password")} />
            {detailsForm.formState.errors.password && (
              <p className="mt-1 text-sm text-red-600">{detailsForm.formState.errors.password.message}</p>
            )}
          </div>

          {refFromCookie && (
            <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">
              {t("register.referralNotice")} <strong>{refFromCookie}</strong>
            </div>
          )}

          {serverError && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <Button type="submit" disabled={isLoading} className="mt-2">
            {isLoading ? t("register.loading") : t("register.submit")}
          </Button>
        </form>
      )}
    </div>
  );
}

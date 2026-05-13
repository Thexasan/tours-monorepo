"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { getRoleHome } from "@/src/shared/hooks/role-routes";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";

const registerSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(8, "Минимум 8 символов"),
  fullName: z.string().min(2, "Имя минимум 2 символа").max(100),
  phone: z.string().regex(/^\+?[0-9\s\-()]{6,20}$/, "Некорректный телефон").optional().or(z.literal("")),
  referralCode: z.string().optional().or(z.literal("")),
});
type RegisterValues = z.infer<typeof registerSchema>;

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
  const [serverError, setServerError] = useState<string | null>(null);
  const [refFromCookie, setRefFromCookie] = useState<string | undefined>();

  // Параметры из URL: ?email=... ?name=... ?phone=... (pre-fill после гостевой заявки),
  // ?bookingId=... (после регистрации идём в /dashboard/trips).
  const prefillEmail = searchParams?.get("email") ?? "";
  const prefillName = searchParams?.get("name") ?? "";
  const prefillPhone = searchParams?.get("phone") ?? "";
  const hasGuestBooking = Boolean(searchParams?.get("bookingId"));

  const {
    register, handleSubmit, setValue, formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: prefillEmail, password: "", fullName: prefillName, phone: prefillPhone, referralCode: "" },
  });

  useEffect(() => {
    const code = readReferralCookie();
    if (code) {
      setRefFromCookie(code);
      setValue("referralCode", code);
    }
  }, [setValue]);

  const onSubmit = async (values: RegisterValues) => {
    setServerError(null);
    try {
      const u = await registerUser({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        phone: values.phone || undefined,
        referralCode: values.referralCode || undefined,
      });
      // Если была гостевая заявка — ведём пользователя сразу в "Мои поездки",
      // чтобы он увидел только что привязанную к нему заявку.
      const target = hasGuestBooking
        ? `/${locale}/dashboard/trips`
        : getRoleHome(u.role, locale);
      router.push(target);
      router.refresh();
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Ошибка регистрации");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {hasGuestBooking && (
        <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800">
          У вас уже есть гостевая заявка. После регистрации она появится в вашем кабинете —
          сможете отслеживать статус и оставить отзыв после поездки.
        </div>
      )}

      <div>
        <Label htmlFor="fullName">Имя и фамилия</Label>
        <Input id="fullName" autoComplete="name" {...register("fullName")} />
        {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>}
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
      </div>

      <div>
        <Label htmlFor="phone">Телефон (опционально)</Label>
        <Input id="phone" type="tel" autoComplete="tel" placeholder="+998..." {...register("phone")} />
        {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
      </div>

      <div>
        <Label htmlFor="password">Пароль</Label>
        <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
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
        {isLoading ? "Создаём аккаунт..." : "Зарегистрироваться"}
      </Button>
    </form>
  );
}

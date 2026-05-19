"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { getRoleHome } from "@/src/shared/hooks/role-routes";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";

export function LoginForm() {
  const t = useTranslations("auth");
  const { login, isLoading } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const locale = useLocale();
  const [serverError, setServerError] = useState<string | null>(null);

  const loginSchema = z.object({
    email: z.string().email(t("login.validEmail")),
    password: z.string().min(1, t("login.validPassword")),
  });
  type LoginValues = z.infer<typeof loginSchema>;

  const {
    register, handleSubmit, formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginValues) => {
    setServerError(null);
    try {
      const u = await login(values);
      const redirectTo = search?.get("redirectTo");
      const dest = redirectTo && redirectTo.startsWith(`/${locale}`)
        ? redirectTo
        : getRoleHome(u.role, locale);
      router.push(dest);
      router.refresh();
    } catch (e) {
      setServerError(e instanceof Error ? e.message : t("login.errorFallback"));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="email">{t("login.emailLabel")}</Label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
      </div>

      <div>
        <Label htmlFor="password">{t("login.passwordLabel")}</Label>
        <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
      </div>

      {serverError && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <Button type="submit" disabled={isLoading} className="mt-2">
        {isLoading ? t("login.loading") : t("login.submit")}
      </Button>
    </form>
  );
}

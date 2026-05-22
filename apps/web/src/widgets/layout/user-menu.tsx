"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, User, Briefcase, ShieldCheck, LogOut, LogIn, Heart } from "lucide-react";
import { useAuthStore } from "@/src/shared/store/auth-store";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { Button } from "@/src/components/ui/button";

export function UserMenu({ transparent = false }: { transparent?: boolean }) {
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const { logout } = useAuth();
  const locale = useLocale();
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!isHydrated) {
    return <div className="w-24 h-9" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-1.5">
        <Link
          href={`/${locale}/login`}
          className={`inline-flex items-center gap-1.5 text-sm font-medium px-2 py-2 rounded-md transition-colors ${
            transparent
              ? "text-white/85 hover:text-white hover:bg-white/10"
              : "text-zinc-700 hover:text-zinc-900"
          }`}
        >
          <LogIn className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">{t("userMenu.loginLabel")}</span>
        </Link>
        <Link href={`/${locale}/register`} className="hidden sm:block">
          <Button size="sm">{t("userMenu.registerLabel")}</Button>
        </Link>
      </div>
    );
  }

  const roleConfig = (() => {
    if (user.role === "ADMIN") {
      return {
        label: t("userMenu.roleAdmin"),
        cls: "bg-blue-100 text-blue-700",
        icon: ShieldCheck,
        primaryHref: `/${locale}/admin/tours`,
        primaryLabel: t("userMenu.adminPanel"),
      };
    }
    if (user.role === "PARTNER") {
      return {
        label: t("userMenu.rolePartner"),
        cls: "bg-emerald-100 text-emerald-700",
        icon: Briefcase,
        primaryHref: `/${locale}/partner/dashboard`,
        primaryLabel: t("userMenu.partnerCabinet"),
      };
    }
    return {
      label: t("userMenu.roleClient"),
      cls: "bg-zinc-100 text-zinc-700",
      icon: User,
      primaryHref: `/${locale}/dashboard/profile`,
      primaryLabel: t("userMenu.clientCabinet"),
    };
  })();

  const Icon = roleConfig.icon;
  const initials = user.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("") || user.email[0]?.toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${
          transparent ? "hover:bg-white/10" : "hover:bg-zinc-50"
        }`}
      >
        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
          transparent ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-700"
        }`}>
          {initials}
        </span>
        <span className="hidden md:flex flex-col items-start leading-tight">
          <span className={`text-sm font-medium truncate max-w-[120px] transition-colors ${
            transparent ? "text-white" : "text-zinc-900"
          }`}>{user.fullName}</span>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded transition-colors ${
            transparent ? "bg-white/20 text-white/90" : roleConfig.cls
          }`}>
            {roleConfig.label}
          </span>
        </span>
        <ChevronDown className={`w-4 h-4 transition-colors ${transparent ? "text-white/70" : "text-zinc-500"}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 max-w-[min(256px,calc(100vw-8px))] bg-white border border-zinc-200 rounded-lg shadow-xl py-1 z-[9999] overflow-hidden" style={{ isolation: "isolate" }}>
          <div className="px-4 py-3 border-b border-zinc-100">
            <p className="text-sm font-medium text-zinc-900 truncate">{user.fullName}</p>
            <p className="text-xs text-zinc-500 truncate">{user.email}</p>
          </div>

          <Link
            href={roleConfig.primaryHref}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            <Icon className="w-4 h-4" />
            <span className="font-medium">{roleConfig.primaryLabel}</span>
          </Link>

          {user.role === "ADMIN" && (
            <Link
              href={`/${locale}/admin/profile`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
            >
              <User className="w-4 h-4" />
              <span>{t("userMenu.myProfile")}</span>
            </Link>
          )}
          {user.role === "PARTNER" && (
            <Link
              href={`/${locale}/partner/profile`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
            >
              <User className="w-4 h-4" />
              <span>{t("userMenu.myProfile")}</span>
            </Link>
          )}

          {user.role === "CLIENT" && (
            <Link
              href={`/${locale}/dashboard/referrals`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
            >
              <Briefcase className="w-4 h-4" />
              <span>{t("userMenu.referral")}</span>
            </Link>
          )}

          <Link
            href={`/${locale}/wishlist`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
          >
            <Heart className="w-4 h-4 text-rose-500" />
            <span>{t("userMenu.wishlist")}</span>
          </Link>

          <div className="border-t border-zinc-100 mt-1">
            <button
              type="button"
              onClick={() => { setOpen(false); void logout(); }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              <span>{t("userMenu.logout")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

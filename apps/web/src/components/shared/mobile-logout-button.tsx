"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/src/shared/hooks/use-auth";

export function MobileLogoutButton() {
  const { logout } = useAuth();
  const t = useTranslations();

  return (
    <div className="lg:hidden mt-8 pt-6 border-t border-slate-100">
      <button
        type="button"
        onClick={() => void logout()}
        className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl text-sm font-semibold text-rose-600 bg-rose-50 ring-1 ring-rose-100 hover:bg-rose-100 transition active:scale-95"
      >
        <LogOut className="h-4 w-4" />
        {t("userMenu.logout")}
      </button>
    </div>
  );
}

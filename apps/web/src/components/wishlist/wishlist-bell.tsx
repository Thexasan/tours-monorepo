"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useLocale } from "next-intl";
import { useAuthStore } from "@/src/shared/store/auth-store";
import { useWishlistMy } from "@/src/shared/hooks/use-wishlist";
import { cn } from "@/src/lib/utils";

export function WishlistBell({ transparent = false }: { transparent?: boolean }) {
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const locale = useLocale();
  const { data } = useWishlistMy();

  if (!isHydrated || !user) return null;

  const count = data?.total ?? 0;
  const hasDrop = data?.items.some((i) => i.priceDrop) ?? false;

  return (
    <Link
      href={`/${locale}/wishlist`}
      aria-label="Избранное"
      className={cn(
        "relative hidden sm:grid place-items-center h-9 w-9 rounded-lg transition-colors",
        transparent ? "text-white/85 hover:text-white hover:bg-white/10" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
      )}
    >
      <Heart className={cn("h-5 w-5", hasDrop && "text-rose-400")} />
      {count > 0 && (
        <span
          className={cn(
            "absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full",
            "flex items-center justify-center text-[9px] font-bold text-white",
            hasDrop ? "bg-rose-500" : "bg-teal-500",
          )}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

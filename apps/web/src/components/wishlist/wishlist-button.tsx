"use client";

import { Heart } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAuthStore } from "@/src/shared/store/auth-store";
import { useWishlistStatus, useWishlistToggle } from "@/src/shared/hooks/use-wishlist";
import { cn } from "@/src/lib/utils";

interface Props {
  tourId: string;
  variant?: "sidebar" | "hero";
  className?: string;
  label?: string;
  labelActive?: string;
}

export function WishlistButton({ tourId, variant = "sidebar", className, label, labelActive }: Props) {
  const user = useAuthStore((s) => s.user);
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("common");

  const { data } = useWishlistStatus(tourId);
  const toggle = useWishlistToggle(tourId);

  const wishlisted = data?.wishlisted ?? false;

  function handleClick() {
    if (!user) {
      router.push(`/${locale}/login?redirect=${encodeURIComponent(pathname ?? "/")}`);
      return;
    }
    toggle.mutate();
  }

  if (variant === "hero") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={toggle.isPending}
        aria-label={wishlisted ? (labelActive ?? t("wishlist.addedAriaLabel")) : (label ?? t("wishlist.addAriaLabel"))}
        className={cn(
          "grid place-items-center h-11 w-11 md:h-14 md:w-14 rounded-full",
          "bg-white/10 text-white backdrop-blur ring-1 ring-white/25 hover:bg-white/20 transition",
          toggle.isPending && "opacity-70",
          className,
        )}
      >
        <Heart
          className={cn("h-4 w-4 md:h-5 md:w-5 transition-colors", wishlisted && "fill-rose-400 text-rose-400")}
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={toggle.isPending}
      className={cn(
        "mt-2 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full",
        "text-sm font-semibold bg-slate-50 text-slate-700 ring-1 ring-slate-200",
        "hover:bg-slate-100 transition",
        toggle.isPending && "opacity-70",
        className,
      )}
    >
      <Heart className={cn("h-4 w-4", wishlisted && "fill-rose-500 text-rose-500")} />
      {wishlisted ? (labelActive ?? t("wishlist.addedLabel")) : (label ?? t("wishlist.addLabel"))}
    </button>
  );
}

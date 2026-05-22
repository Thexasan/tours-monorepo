"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";

const AUTH_PATHS = ["/login", "/register", "/forgot-password"];

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const router   = useRouter();
  const locale   = useLocale();
  const pathname = usePathname();

  if (AUTH_PATHS.some(p => pathname?.includes(p))) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    router.push(`/${locale}/register?email=${encodeURIComponent(email.trim())}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className="w-full sm:w-56 px-4 py-2.5 rounded-xl bg-white/[0.07] ring-1 ring-white/11 text-white placeholder-white/25 text-sm outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
      />
      <button
        type="submit"
        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white font-semibold text-sm transition-colors"
      >
        Подписаться
      </button>
    </form>
  );
}

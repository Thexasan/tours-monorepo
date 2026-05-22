"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Copy, Check, Send, MessageCircle, Share2, Gift,
  MousePointerClick, UserPlus, ShoppingBag, TrendingUp, Sparkles,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { referralsApi } from "@/src/shared/api/referrals-api";
import { Button } from "@/src/components/ui/button";

export function ReferralsPanel() {
  const locale = useLocale();
  const t = useTranslations('dashboard');
  const [copied, setCopied] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["referrals", "stats"],
    queryFn: () => referralsApi.stats(),
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const refLink = data ? `${appUrl}/${locale}/tours?ref=${data.referralCode}` : "";

  const onCopy = () => {
    if (!refLink) return;
    void navigator.clipboard.writeText(refLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareText = t('client.referrals.shareText');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-44 rounded-3xl tv-shimmer" />
        <div className="h-32 rounded-2xl tv-shimmer" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl tv-shimmer" />
          ))}
        </div>
      </div>
    );
  }
  if (isError || !data) {
    return <div className="text-rose-600">{t('client.referrals.pendingDesc')}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <header className="relative overflow-hidden p-8 md:p-10 rounded-3xl border border-white/10 shadow-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950">
        {/* Cosmic glow circles */}
        <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -bottom-24 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 top-1/4 w-40 h-40 rounded-full bg-teal-500/5 blur-3xl pointer-events-none animate-pulse" />

        <div className="flex flex-col md:flex-row md:items-end gap-6 relative z-10">
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-teal-400">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" /> {t('client.referrals.title')}
            </div>
            <h1 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
              {t('client.referrals.subtitle')}
            </h1>
            <p className="mt-2 text-slate-300 font-medium max-w-xl text-sm leading-relaxed">
              {data.remaining > 0
                ? t('client.referrals.leftToInvite', { count: data.remaining })
                : t('client.referrals.congrats')}
            </p>
          </div>

          {/* Progress metric card */}
          <div className="md:w-80 shrink-0 bg-white/5 border border-white/10 backdrop-blur-md p-5 rounded-2xl shadow-inner relative">
            <div className="flex items-baseline justify-between text-white">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{t('client.referrals.friendsCount')}</p>
              <p className="text-3xl font-extrabold tabular-nums text-white">
                {data.referralCount}
                <span className="text-slate-400 text-sm font-semibold"> / {data.threshold}</span>
              </p>
            </div>
            <div className="mt-3 h-3 rounded-full bg-black/35 overflow-hidden p-0.5 border border-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-400 transition-all duration-1000 ease-out shadow-sm"
                style={{ width: `${Math.min(100, data.progressPercent)}%` }}
              />
            </div>
            {data.freeToursAvailable > 0 && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-500 px-4 py-2.5 text-teal-950 text-xs font-extrabold shadow-lg shadow-teal-500/10">
                <Gift className="h-4.5 w-4.5 text-teal-950 shrink-0 animate-bounce" />
                {t('client.referrals.available')}: {data.freeToursAvailable} {t('client.referrals.freeTour')}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Stats tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label={t('client.referrals.clicks')} value={data.clicks} hint={t('client.referrals.clicksSub')}
          icon={MousePointerClick} tone="sky" />
        <StatTile label={t('client.referrals.registrations')} value={data.registrations} hint={t('client.referrals.registrationsSub')}
          icon={UserPlus} tone="teal" />
        <StatTile label={t('client.referrals.paid')} value={data.paidBookings} hint={t('client.referrals.paidSub')}
          icon={ShoppingBag} tone="emerald" />
        <StatTile label={t('client.referrals.conversion')} value={`${data.conversionRate}%`} hint={t('client.referrals.conversionSub')}
          icon={TrendingUp} tone="amber" />
      </div>

      {/* Referral link generation */}
      <section className="tv-surface-elevated p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm bg-gradient-to-b from-white to-slate-50/20">
        <h3 className="font-bold text-slate-900 text-lg">{t('client.referrals.linkTitle')}</h3>
        <p className="text-xs font-semibold text-slate-400 mt-1">
          {t('client.referrals.linkHint')}
        </p>

        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            readOnly
            value={refLink}
            className="flex-1 h-12 rounded-2xl border border-slate-200/80 px-4 text-xs font-mono bg-slate-50/80 text-slate-700 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all duration-300 font-bold"
            onClick={(e) => e.currentTarget.select()}
          />
          <Button onClick={onCopy} variant={copied ? "default" : "outline"} className={`shrink-0 h-12 px-6 rounded-2xl font-bold transition-all duration-300 active:scale-95 ${copied ? "bg-emerald-600 hover:bg-emerald-700 border-transparent text-white" : "hover:bg-slate-100 text-slate-700"}`}>
            {copied ? (<><Check className="w-4.5 h-4.5 mr-1" />{t('client.referrals.copied')}</>) : (<><Copy className="w-4.5 h-4.5 mr-1" />{t('client.referrals.copyLink')}</>)}
          </Button>
        </div>

        <div className="mt-6">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-3">{t('client.referrals.shareTitle')}</p>
          <div className="flex flex-wrap gap-2.5">
            <ShareLink
              href={`https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(shareText)}`}
              className="bg-[#229ED9] hover:bg-[#1e8ec3] shadow-[#229ED9]/15 hover:shadow-[#229ED9]/30"
              icon={<Send className="h-4 w-4" />}
              label="Telegram"
            />
            <ShareLink
              href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${refLink}`)}`}
              className="bg-[#25D366] hover:bg-[#21be5c] shadow-[#25D366]/15 hover:shadow-[#25D366]/30"
              icon={<MessageCircle className="h-4 w-4" />}
              label="WhatsApp"
            />
            <ShareLink
              href={`https://vk.com/share.php?url=${encodeURIComponent(refLink)}&title=${encodeURIComponent(shareText)}`}
              className="bg-[#0077FF] hover:bg-[#006be5] shadow-[#0077FF]/15 hover:shadow-[#0077FF]/30"
              icon={<Share2 className="h-4 w-4" />}
              label="VK"
            />
          </div>
        </div>
      </section>

      {/* Notices */}
      {data.pendingBookings > 0 && (
        <div className="relative overflow-hidden flex items-start gap-4 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/50 p-5 text-amber-900 shadow-sm">
          <span className="grid place-items-center h-10 w-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-500 text-white shadow-md shadow-amber-500/20 shrink-0">
            <ShoppingBag className="h-5 w-5" />
          </span>
          <div>
            <p className="font-bold text-amber-950">{t('client.referrals.pendingBooking', { count: data.pendingBookings })}</p>
            <p className="text-xs font-semibold text-amber-800/80 mt-1">{t('client.referrals.pendingHint')}</p>
          </div>
        </div>
      )}

      {data.role === "PARTNER" && (
        <div className="relative overflow-hidden flex items-start gap-4 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-200/50 p-5 text-emerald-950 shadow-sm">
          <span className="grid place-items-center h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20 shrink-0 animate-pulse">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <p className="font-bold">{t('client.referrals.isPartner')}</p>
            <p className="text-xs font-semibold text-emerald-800/80 mt-1">
              <a href={`/${locale}/partner/dashboard`} className="font-extrabold text-emerald-600 underline underline-offset-4 hover:text-emerald-700 transition-colors">{t('client.referrals.partnerCabinet')}</a>
            </p>
          </div>
        </div>
      )}

      {data.role === "CLIENT" && (
        <div className="relative overflow-hidden flex items-start gap-4 rounded-3xl bg-gradient-to-r from-slate-500/5 to-transparent border border-slate-200/50 p-5 text-slate-700 shadow-sm">
          <span className="grid place-items-center h-10 w-10 rounded-2xl bg-gradient-to-tr from-slate-400 to-slate-500 text-white shadow-md shrink-0">
            <TrendingUp className="h-5 w-5" />
          </span>
          <div>
            <p className="font-bold text-slate-900">{t('client.referrals.becomePartnerHint')}</p>
            <p className="text-xs font-medium text-slate-500 mt-1 leading-relaxed">
              <a href={`mailto:${t('client.referrals.contactEmail')}`} className="font-extrabold text-teal-600 underline underline-offset-4 hover:text-teal-700 transition-colors">
                {t('client.referrals.contactEmail')}
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ShareLink({
  href, icon, label, className,
}: { href: string; icon: React.ReactNode; label: string; className: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2.5 px-5 py-3.5 rounded-2xl text-white text-xs font-extrabold tracking-wider uppercase shadow-md hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all duration-300 ${className}`}
    >
      {icon} <span>{label}</span>
    </a>
  );
}

function StatTile({
  label, value, hint, icon: Icon, tone,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: React.ElementType;
  tone: "teal" | "sky" | "emerald" | "amber" | "rose";
}) {
  const toneCls = {
    teal: {
      badge: "bg-teal-500/10 text-teal-600 border-teal-500/20",
      iconBg: "bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-[0_4px_12px_rgba(13,148,136,0.2)]",
      hover: "hover:border-teal-500/30 hover:shadow-[0_8px_20px_-6px_rgba(13,148,136,0.1)]",
    },
    sky: {
      badge: "bg-teal-500/10 text-teal-600 border-teal-500/20",
      iconBg: "bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-[0_4px_12px_rgba(13,148,136,0.2)]",
      hover: "hover:border-teal-500/30 hover:shadow-[0_8px_20px_-6px_rgba(13,148,136,0.1)]",
    },
    emerald: {
      badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      iconBg: "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.2)]",
      hover: "hover:border-emerald-500/30 hover:shadow-[0_8px_20px_-6px_rgba(16,185,129,0.1)]",
    },
    amber: {
      badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      iconBg: "bg-gradient-to-br from-emerald-500 to-cyan-400 text-white shadow-[0_4px_12px_rgba(16,185,129,0.25)]",
      hover: "hover:border-emerald-500/30 hover:shadow-[0_8px_20px_-6px_rgba(16,185,129,0.1)]",
    },
    rose: {
      badge: "bg-rose-500/10 text-rose-600 border-rose-500/20",
      iconBg: "bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-[0_4px_12px_rgba(244,63,94,0.2)]",
      hover: "hover:border-rose-500/30 hover:shadow-[0_8px_20px_-6px_rgba(244,63,94,0.1)]",
    },
  }[tone];

  return (
    <div className={`relative overflow-hidden tv-surface border ${toneCls.badge} p-5 flex flex-col justify-between rounded-2xl transition-all duration-300 hover:-translate-y-1 ${toneCls.hover} group`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{label}</span>
        <span className={`grid place-items-center h-9 w-9 rounded-xl transition-transform duration-300 group-hover:scale-110 ${toneCls.iconBg}`}>
          <Icon className="h-4.5 w-4.5" />
        </span>
      </div>
      <div className="mt-4">
        <p className="text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums leading-none">{value}</p>
        {hint && <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-wide">{hint}</p>}
      </div>
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
}

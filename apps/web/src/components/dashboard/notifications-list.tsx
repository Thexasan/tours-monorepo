"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Bell, Check, ChevronRight, Plane, FileText, DollarSign, Star, XCircle } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useNotifications } from "@/src/hooks/use-notifications";
import type { NotificationType } from "@tours/types";

const TYPE_META: Record<NotificationType, { icon: React.ElementType; dot: string }> = {
  BOOKING_ACCEPTED:            { icon: Check,      dot: "bg-teal-500" },
  BOOKING_DOCUMENTS_REQUESTED: { icon: FileText,   dot: "bg-violet-500" },
  BOOKING_DOCUMENTS_CONFIRMED: { icon: Check,      dot: "bg-emerald-500" },
  BOOKING_DOCUMENTS_REJECTED:  { icon: FileText,   dot: "bg-amber-500" },
  BOOKING_PAYMENT_REQUESTED:   { icon: DollarSign, dot: "bg-blue-500" },
  BOOKING_PAID:                { icon: DollarSign, dot: "bg-emerald-600" },
  BOOKING_COMPLETED:           { icon: Star,       dot: "bg-slate-500" },
  BOOKING_CANCELLED:           { icon: XCircle,    dot: "bg-rose-500" },
};

export function NotificationsList() {
  const { notifications, unread, isLoading, markRead, markAllRead } = useNotifications();
  const router = useRouter();
  const locale = useLocale();

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="tv-surface p-4 flex gap-3">
            <div className="h-9 w-9 rounded-full bg-slate-100 shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3 w-2/5 rounded bg-slate-100" />
              <div className="h-3 w-3/4 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="tv-surface-elevated p-14 text-center">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-slate-100 grid place-items-center text-slate-300 mb-4">
          <Bell className="h-7 w-7" />
        </div>
        <p className="font-semibold text-slate-900">Нет уведомлений</p>
        <p className="text-sm text-slate-500 mt-1">Здесь будут появляться обновления по вашим заявкам.</p>
      </div>
    );
  }

  const unreadItems = notifications.filter((n) => !n.isRead);
  const readItems = notifications.filter((n) => n.isRead);

  return (
    <div className="space-y-5">
      {unread > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Непрочитанных: <strong className="text-slate-900">{unread}</strong>
          </p>
          <Button variant="outline" size="sm" onClick={() => markAllRead()}>
            <Check className="h-3.5 w-3.5" />
            Прочитать все
          </Button>
        </div>
      )}

      {unreadItems.length > 0 && (
        <div className="space-y-2">
          {unreadItems.map((n) => {
            const meta = TYPE_META[n.type] ?? { icon: Bell, dot: "bg-slate-400" };
            const Icon = meta.icon;
            return (
              <div
                key={n.id}
                className="tv-surface-elevated p-4 flex gap-3 cursor-pointer hover:bg-teal-50/40 transition-colors rounded-2xl ring-2 ring-teal-500/20"
                onClick={() => {
                  markRead(n.id);
                  if (n.bookingId) router.push(`/${locale}/dashboard/trips/${n.bookingId}`);
                }}
              >
                <div className={`h-9 w-9 rounded-full ${meta.dot} bg-opacity-15 grid place-items-center shrink-0`}>
                  <Icon className={`h-4 w-4 text-slate-700`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900 leading-snug">{n.title}</p>
                    <span className="h-2 w-2 rounded-full bg-teal-500 shrink-0 mt-1.5" />
                  </div>
                  <p className="text-sm text-slate-600 mt-0.5 leading-snug">{n.body}</p>
                  <p className="text-xs text-slate-400 mt-1.5">
                    {new Date(n.createdAt).toLocaleString("ru-RU", {
                      day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
                {n.bookingId && <ChevronRight className="h-4 w-4 text-slate-300 shrink-0 mt-1" />}
              </div>
            );
          })}
        </div>
      )}

      {readItems.length > 0 && (
        <div className="space-y-2">
          {unreadItems.length > 0 && (
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
              Прочитанные
            </p>
          )}
          {readItems.map((n) => {
            const meta = TYPE_META[n.type] ?? { icon: Bell, dot: "bg-slate-400" };
            const Icon = meta.icon;
            return (
              <div
                key={n.id}
                className={`tv-surface p-4 flex gap-3 transition-colors rounded-2xl ${n.bookingId ? "cursor-pointer hover:bg-slate-50" : ""}`}
                onClick={() => {
                  if (n.bookingId) router.push(`/${locale}/dashboard/trips/${n.bookingId}`);
                }}
              >
                <div className="h-9 w-9 rounded-full bg-slate-100 grid place-items-center shrink-0">
                  <Icon className="h-4 w-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-600 leading-snug">{n.title}</p>
                  <p className="text-sm text-slate-500 mt-0.5 leading-snug">{n.body}</p>
                  <p className="text-xs text-slate-400 mt-1.5">
                    {new Date(n.createdAt).toLocaleString("ru-RU", {
                      day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
                {n.bookingId && <ChevronRight className="h-4 w-4 text-slate-200 shrink-0 mt-1" />}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-center text-xs text-slate-400 pb-2">
        Показаны последние {notifications.length} уведомлений
      </p>
    </div>
  );
}

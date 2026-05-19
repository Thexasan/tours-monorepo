"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Bell } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useNotifications } from "@/src/hooks/use-notifications";
import { useAuthStore } from "@/src/shared/store/auth-store";

export function NotificationsBell({ transparent }: { transparent?: boolean }) {
  const { user, isHydrated } = useAuthStore();
  const { notifications, unread, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  // All hooks above — early return only after all hooks
  if (!isHydrated || !user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative p-2 rounded-lg transition-colors",
          transparent
            ? "text-white/80 hover:text-white hover:bg-white/10"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
        )}
        aria-label="Уведомления"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200/60 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="text-sm font-semibold text-slate-900">
              Уведомления
              {unread > 0 && (
                <span className="ml-2 text-xs font-normal text-slate-400">{unread} непрочитанных</span>
              )}
            </span>
            {unread > 0 && (
              <button
                onClick={() => markAllRead()}
                className="text-xs text-orange-700 hover:underline"
              >
                Прочитать все
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="h-8 w-8 mx-auto mb-2 text-slate-200" />
                <p className="text-sm text-slate-400">Нет уведомлений</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer",
                    !n.isRead && "bg-orange-50/60",
                  )}
                  onClick={() => {
                    if (!n.isRead) markRead(n.id);
                    if (n.bookingId) {
                      router.push(`/${locale}/dashboard/trips/${n.bookingId}`);
                    }
                    setOpen(false);
                  }}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full shrink-0 mt-1.5",
                        !n.isRead ? "bg-orange-500" : "bg-transparent",
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 leading-snug">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-snug">{n.body}</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {new Date(n.createdAt).toLocaleString("ru-RU", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

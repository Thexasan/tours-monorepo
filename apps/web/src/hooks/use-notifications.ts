"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/src/shared/api/notifications-api";
import { useAuthStore } from "@/src/shared/store/auth-store";

export function useNotifications() {
  const qc = useQueryClient();
  const { user, isHydrated } = useAuthStore();

  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationsApi.list,
    enabled: isHydrated && !!user,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    retry: false,
  });

  const markReadM = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllReadM = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return {
    notifications: query.data?.items ?? [],
    unread: query.data?.unread ?? 0,
    isLoading: query.isLoading,
    markRead: (id: string) => markReadM.mutate(id),
    markAllRead: () => markAllReadM.mutate(),
  };
}

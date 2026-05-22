"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { wishlistApi } from "@/src/shared/api/wishlist-api";
import { useAuthStore } from "@/src/shared/store/auth-store";

export function useWishlistStatus(tourId: string) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ["wishlist-status", tourId],
    queryFn: () => wishlistApi.status(tourId),
    enabled: !!user,
    staleTime: 60_000,
  });
}

export function useWishlistToggle(tourId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => wishlistApi.toggle(tourId),
    onSuccess: (data) => {
      queryClient.setQueryData(["wishlist-status", tourId], data);
      void queryClient.invalidateQueries({ queryKey: ["wishlist-my"] });
    },
  });
}

export function useWishlistMy() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ["wishlist-my"],
    queryFn: () => wishlistApi.listMy(),
    enabled: !!user,
    staleTime: 30_000,
  });
}

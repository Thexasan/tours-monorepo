"use client";

import { useQuery } from "@tanstack/react-query";
import { bookingDocumentsApi } from "@/src/shared/api/booking-documents-api";

export function useBooking(bookingId: string) {
  return useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => bookingDocumentsApi.getDetail(bookingId),
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });
}

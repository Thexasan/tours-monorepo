"use client";

import { useQuery } from "@tanstack/react-query";
import { adminToursApi } from "@/src/shared/api/admin-tours-api";
import { TourFormWorkspace } from "@/src/components/admin/tour-form-workspace";
import { RefreshCw, Inbox } from "lucide-react";

export function EditTourClient({ tourId }: { tourId: string }) {
  const { data: tours, isLoading } = useQuery({
    queryKey: ["admin", "tours"],
    queryFn: () => adminToursApi.list(true),
  });

  const tour = tours?.find((t) => t.id === tourId);

  if (isLoading) {
    return (
      <div className="tv-surface-elevated p-16 text-center text-slate-500 bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="h-6 w-6 text-teal-600 animate-spin" />
        <p className="text-sm font-semibold">Загружаем информацию о туре...</p>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="tv-surface-elevated p-16 text-center text-slate-400 bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <Inbox className="h-10 w-10 text-slate-300 mx-auto mb-3.5" />
        <p className="text-sm font-bold text-slate-800">Тур не найден</p>
        <p className="text-xs text-slate-400 mt-1">Тур с указанным ID не найден в системе или был удалён.</p>
      </div>
    );
  }

  return <TourFormWorkspace tour={tour} />;
}

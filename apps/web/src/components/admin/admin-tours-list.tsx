"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Archive, Star } from "lucide-react";
import { adminToursApi } from "@/src/shared/api/admin-tours-api";
import { extractErrorMessage } from "@/src/shared/api/apiClient";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { TourFormModal } from "./tour-form-modal";
import type { Tour } from "@tours/types";

export function AdminToursList() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Tour | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: tours, isLoading } = useQuery({
    queryKey: ["admin", "tours"],
    queryFn: () => adminToursApi.list(true),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => adminToursApi.archive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "tours"] });
      toast.success("Тур перемещён в архив");
    },
    onError: (e) => toast.error("Не удалось архивировать тур", { description: extractErrorMessage(e) }),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => adminToursApi.update(id, { isActive: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "tours"] });
      toast.success("Тур восстановлен");
    },
    onError: (e) => toast.error("Не удалось восстановить тур", { description: extractErrorMessage(e) }),
  });

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-zinc-600">{tours ? `${tours.length} туров` : "Загрузка..."}</p>
        <Button onClick={() => setCreating(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Новый тур
        </Button>
      </div>

      {isLoading && <p className="text-zinc-500">Загрузка…</p>}

      {tours && tours.length > 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Тур</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Страна</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Цена</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Звёзды</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Статус</th>
                <th className="text-right px-4 py-3 font-medium text-zinc-600">Действия</th>
              </tr>
            </thead>
            <tbody>
              {tours.map((t) => (
                <tr key={t.id} className="border-b last:border-b-0 border-zinc-100 hover:bg-zinc-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded overflow-hidden bg-zinc-100 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={t.coverImage} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900">{t.title.ru}</p>
                        <p className="text-xs text-zinc-500 font-mono">{t.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{t.country}</td>
                  <td className="px-4 py-3 text-zinc-900 font-medium">${t.priceUsd}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: t.hotelStars }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-current" />
                      ))}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {t.isActive ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">Активен</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded bg-zinc-200 text-zinc-700">В архиве</span>
                    )}
                    {t.isHot && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">🔥 Горячий</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(t)}
                        className="p-1.5 text-zinc-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Редактировать"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {t.isActive ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Архивировать тур "${t.title.ru}"?`)) {
                              archiveMutation.mutate(t.id);
                            }
                          }}
                          className="p-1.5 text-zinc-600 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Архивировать"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => restoreMutation.mutate(t.id)}
                          className="text-xs text-blue-600 hover:underline px-2"
                          title="Восстановить"
                        >
                          Восстановить
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(creating || editing) && (
        <TourFormModal
          tour={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => qc.invalidateQueries({ queryKey: ["admin", "tours"] })}
        />
      )}
    </>
  );
}

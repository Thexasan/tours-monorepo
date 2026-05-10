"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X, ExternalLink } from "lucide-react";
import { partnersApi } from "@/src/shared/api/partners-api";
import { extractErrorMessage } from "@/src/shared/api/apiClient";
import { Button } from "@/src/components/ui/button";

const STATUS_FILTERS = [
  { value: "PENDING", label: "Ждут рассмотрения" },
  { value: "APPROVED", label: "Одобрены" },
  { value: "REJECTED", label: "Отклонены" },
] as const;

export function AdminPartnerApplications() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: apps, isLoading } = useQuery({
    queryKey: ["admin", "partner-applications", filter],
    queryFn: () => partnersApi.listAll(filter),
  });

  const approveM = useMutation({
    mutationFn: (id: string) => partnersApi.review(id, "APPROVE"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "partner-applications"] }),
  });
  const rejectM = useMutation({
    mutationFn: (vars: { id: string; reason: string }) =>
      partnersApi.review(vars.id, "REJECT", vars.reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "partner-applications"] });
      setRejectingId(null); setRejectReason("");
    },
  });

  return (
    <>
      <div className="flex gap-2 mb-4">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value} type="button"
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              filter === f.value
                ? "bg-blue-600 text-white"
                : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-zinc-500">Загрузка...</p>}

      {apps && apps.length === 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center text-zinc-500">
          Заявок в этом статусе нет.
        </div>
      )}

      <div className="space-y-4">
        {apps?.map((app) => (
          <div key={app.id} className="bg-white rounded-xl border border-zinc-200 p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <p className="font-semibold text-zinc-900">{app.user.fullName}</p>
                <p className="text-sm text-zinc-500">{app.user.email}</p>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">ref: {app.user.referralCode}</p>
              </div>
              <span className="text-xs text-zinc-400">
                {new Date(app.createdAt).toLocaleString("ru-RU")}
              </span>
            </div>

            <div className="bg-zinc-50 rounded-md p-3 text-sm text-zinc-700 mb-3 whitespace-pre-line">
              {app.motivation}
            </div>

            {app.audienceSize && (
              <p className="text-sm text-zinc-600 mb-2">
                <strong>Аудитория:</strong> {app.audienceSize.toLocaleString("ru-RU")}
              </p>
            )}

            {app.socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {app.socialLinks.map((l, i) => (
                  <a key={i} href={l} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs hover:bg-blue-100">
                    <ExternalLink className="w-3 h-3" /> {l.replace(/^https?:\/\//, "").slice(0, 40)}
                  </a>
                ))}
              </div>
            )}

            {app.status === "REJECTED" && app.rejectReason && (
              <div className="mt-2 text-sm text-red-700 italic">
                Отклонено: {app.rejectReason}
              </div>
            )}

            {app.status === "PENDING" && (
              <>
                {rejectingId === app.id ? (
                  <div className="space-y-2 mt-3 pt-3 border-t border-zinc-100">
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Причина отклонения..."
                      rows={2}
                      className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        onClick={() => rejectM.mutate({ id: app.id, reason: rejectReason })}
                        disabled={rejectM.isPending || !rejectReason.trim()}
                      >
                        Отклонить
                      </Button>
                      <Button variant="outline" onClick={() => { setRejectingId(null); setRejectReason(""); }}>
                        Отмена
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-100">
                    <Button
                      onClick={() => approveM.mutate(app.id)}
                      disabled={approveM.isPending}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Check className="w-4 h-4 mr-1" /> Одобрить
                    </Button>
                    <Button variant="outline" onClick={() => setRejectingId(app.id)}>
                      <X className="w-4 h-4 mr-1" /> Отклонить
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {(approveM.isError || rejectM.isError) && (
        <div className="mt-3 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {extractErrorMessage(approveM.error || rejectM.error)}
        </div>
      )}
    </>
  );
}

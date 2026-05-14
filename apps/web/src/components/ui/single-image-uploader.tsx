"use client";

import { useRef, useState, useCallback } from "react";
import { UploadCloud, X, Loader2 } from "lucide-react";
import { uploadImage } from "@/src/shared/api/upload-api";
import { cn } from "@/src/lib/utils";

interface SingleImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
}

export function SingleImageUploader({ value, onChange, label, hint }: SingleImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handle = useCallback(async (file: File) => {
    setError(null);
    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setLoading(true);
    try {
      const serverUrl = await uploadImage(file);
      onChange(serverUrl);
    } catch {
      setPreview(null);
      setError("Ошибка загрузки. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }, [onChange]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handle(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handle(file);
  };

  const clear = () => {
    setPreview(null);
    onChange("");
  };

  const displayUrl = preview ?? value;

  return (
    <div className="space-y-1.5">
      {label && <p className="text-sm font-medium text-slate-700">{label}</p>}

      {displayUrl ? (
        <div className="relative group rounded-xl overflow-hidden ring-1 ring-slate-200 aspect-video w-full max-w-sm bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={displayUrl} alt="Обложка" className="w-full h-full object-cover" />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
              <Loader2 className="h-7 w-7 animate-spin text-white" />
            </div>
          )}
          {!loading && (
            <button
              type="button"
              onClick={clear}
              className="absolute top-2 right-2 h-7 w-7 grid place-items-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition hover:bg-black/80"
              aria-label="Удалить фото"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          disabled={loading}
          className={cn(
            "flex flex-col items-center justify-center gap-2 w-full max-w-sm aspect-video rounded-xl border-2 border-dashed transition",
            dragging ? "border-teal-400 bg-teal-50/60" : "border-slate-200 bg-slate-50/60 hover:border-teal-300 hover:bg-teal-50/40",
            loading && "pointer-events-none opacity-60"
          )}
        >
          <UploadCloud className="h-8 w-8 text-slate-400" />
          <span className="text-sm text-slate-500">Нажмите или перетащите фото</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={onFileChange}
      />

      {hint && <p className="text-xs text-slate-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

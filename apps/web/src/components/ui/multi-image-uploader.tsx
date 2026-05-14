"use client";

import { useRef, useState, useCallback } from "react";
import { X, Loader2, ImagePlus } from "lucide-react";
import { uploadImage } from "@/src/shared/api/upload-api";
import { cn } from "@/src/lib/utils";

interface MultiImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  hint?: string;
  label?: string;
}

export function MultiImageUploader({
  value,
  onChange,
  max = 20,
  hint,
  label,
}: MultiImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files).slice(0, max - value.length);
    if (list.length === 0) return;
    setError(null);
    setLoading(true);
    try {
      const urls = await Promise.all(list.map(uploadImage));
      onChange([...value, ...urls]);
    } catch {
      setError("Ошибка загрузки одного или нескольких файлов.");
    } finally {
      setLoading(false);
    }
  }, [value, onChange, max]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) handleFiles(e.target.files);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  };

  const remove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const canAdd = value.length < max && !loading;

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium text-slate-700">{label}</p>}

      <div className="flex flex-wrap gap-2">
        {value.map((url, idx) => (
          <div key={url + idx} className="relative group h-20 w-20 rounded-lg overflow-hidden ring-1 ring-slate-200 shrink-0 bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`фото ${idx + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => remove(idx)}
              className="absolute top-0.5 right-0.5 h-5 w-5 grid place-items-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition hover:bg-black/80"
              aria-label="Удалить"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {canAdd && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              "h-20 w-20 shrink-0 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed transition text-slate-400",
              dragging ? "border-teal-400 bg-teal-50/60 text-teal-500" : "border-slate-200 bg-slate-50/40 hover:border-teal-300 hover:bg-teal-50/30"
            )}
            aria-label="Добавить фото"
          >
            <ImagePlus className="h-5 w-5" />
            <span className="text-[10px] leading-tight text-center">Добавить</span>
          </button>
        )}

        {loading && (
          <div className="h-20 w-20 shrink-0 flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
            <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={onFileChange}
      />

      {hint && <p className="text-xs text-slate-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {value.length > 0 && (
        <p className="text-xs text-slate-400">{value.length} / {max} фото</p>
      )}
    </div>
  );
}

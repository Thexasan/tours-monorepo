"use client";

import { useRef, useState, useCallback } from "react";
import { X, Loader2, ImagePlus } from "lucide-react";
import { uploadImage } from "@/src/shared/api/upload-api";
import { cn } from "@/src/lib/utils";

interface Item {
  localUrl: string;
  serverUrl: string | null;
}

interface MultiImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  hint?: string;
  label?: string;
}

function toServerUrls(items: Item[]): string[] {
  return items.map(it => it.serverUrl).filter((u): u is string => u !== null);
}

export function MultiImageUploader({ value, onChange, max = 20, hint, label }: MultiImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>(() =>
    value.map(url => ({ localUrl: url, serverUrl: url }))
  );
  // Always-current ref so async callbacks don't work with stale state
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files).slice(0, max - itemsRef.current.length);
    if (list.length === 0) return;
    setError(null);

    const newItems: Item[] = list.map(f => ({
      localUrl: URL.createObjectURL(f),
      serverUrl: null,
    }));

    const withPreviews = [...itemsRef.current, ...newItems];
    setItems(withPreviews);

    await Promise.all(
      list.map(async (file, i) => {
        const localUrl = newItems[i]!.localUrl;
        try {
          const serverUrl = await uploadImage(file);
          const updated = itemsRef.current.map(it =>
            it.localUrl === localUrl ? { ...it, serverUrl } : it
          );
          setItems(updated);
          onChange(toServerUrls(updated));
        } catch {
          const filtered = itemsRef.current.filter(it => it.localUrl !== localUrl);
          setItems(filtered);
          setError("Ошибка загрузки одного или нескольких файлов.");
        }
      })
    );
  }, [max, onChange]);

  const remove = useCallback((localUrl: string) => {
    const updated = itemsRef.current.filter(it => it.localUrl !== localUrl);
    setItems(updated);
    onChange(toServerUrls(updated));
  }, [onChange]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) handleFiles(e.target.files);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  };

  const uploading = items.some(it => !it.serverUrl);
  const canAdd = items.length < max && !uploading;

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium text-slate-700">{label}</p>}

      <div className="flex flex-wrap gap-2">
        {items.map((item, idx) => (
          <div
            key={item.localUrl}
            className="relative group h-20 w-20 rounded-lg overflow-hidden ring-1 ring-slate-200 shrink-0 bg-slate-100"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.localUrl} alt={`фото ${idx + 1}`} className="w-full h-full object-cover" />
            {!item.serverUrl ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => remove(item.localUrl)}
                className="absolute top-0.5 right-0.5 h-5 w-5 grid place-items-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition hover:bg-black/80"
                aria-label="Удалить"
              >
                <X className="h-3 w-3" />
              </button>
            )}
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
              dragging
                ? "border-orange-400 bg-orange-50/60 text-orange-500"
                : "border-slate-200 bg-slate-50/40 hover:border-orange-300 hover:bg-orange-50/30"
            )}
            aria-label="Добавить фото"
          >
            <ImagePlus className="h-5 w-5" />
            <span className="text-[10px] leading-tight text-center">Добавить</span>
          </button>
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
      {items.length > 0 && (
        <p className="text-xs text-slate-400">{items.length} / {max} фото</p>
      )}
    </div>
  );
}

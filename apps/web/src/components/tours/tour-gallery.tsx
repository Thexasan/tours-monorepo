"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Camera, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/src/lib/utils";

const TILE_CLS = [
  "col-span-2 row-span-2",
  "col-span-1 row-span-1",
  "col-span-1 row-span-1",
  "col-span-1 row-span-1",
  "col-span-1 row-span-1",
  "col-span-2 row-span-1",
];

export function TourGallery({ images, title }: { images: string[]; title: string }) {
  const [lightbox, setLightbox] = useState(-1);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (lightbox < 0) return;
      if (e.key === "Escape") setLightbox(-1);
      if (e.key === "ArrowRight") setLightbox(i => (i + 1) % images.length);
      if (e.key === "ArrowLeft") setLightbox(i => (i - 1 + images.length) % images.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, images.length]);

  if (!images.length) return null;

  return (
    <section>
      <div className="flex items-end justify-between gap-3 flex-wrap mb-7">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Фото из путешествия</h2>
          <p className="mt-2 text-slate-600">Реальные снимки гостей за последние 6 месяцев</p>
        </div>
        <button
          type="button"
          onClick={() => setLightbox(0)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
        >
          <Camera className="h-3.5 w-3.5" />
          Все {images.length} фото
        </button>
      </div>

      <div className="grid grid-cols-4 grid-rows-2 gap-3 h-[420px] md:h-[520px]">
        {images.slice(0, 6).map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setLightbox(i)}
            className={cn(
              "relative overflow-hidden rounded-2xl ring-1 ring-slate-100 group bg-slate-100",
              TILE_CLS[i] ?? "col-span-1 row-span-1",
            )}
          >
            <Image
              src={img}
              alt={`${title} — фото ${i + 1}`}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
            {i === 5 && images.length > 6 && (
              <div className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm text-white flex flex-col items-center justify-center gap-1">
                <Camera className="h-[22px] w-[22px]" />
                <span className="text-sm font-semibold">+{images.length - 6} фото</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {lightbox >= 0 && (
        <div
          className="fixed inset-0 z-70 bg-slate-950/95 backdrop-blur flex items-center justify-center p-4"
          onClick={() => setLightbox(-1)}
        >
          <button
            type="button"
            className="absolute top-5 right-5 grid place-items-center h-11 w-11 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
            onClick={() => setLightbox(-1)}
            aria-label="Закрыть"
          >
            <X className="h-[22px] w-[22px]" />
          </button>
          <button
            type="button"
            className="absolute left-5 top-1/2 -translate-y-1/2 grid place-items-center h-12 w-12 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
            onClick={(e) => { e.stopPropagation(); setLightbox(i => (i - 1 + images.length) % images.length); }}
            aria-label="Предыдущее"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            className="absolute right-5 top-1/2 -translate-y-1/2 grid place-items-center h-12 w-12 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
            onClick={(e) => { e.stopPropagation(); setLightbox(i => (i + 1) % images.length); }}
            aria-label="Следующее"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div
            className="relative max-w-[88vw] max-h-[88vh] aspect-16/10"
            onClick={e => e.stopPropagation()}
          >
            <Image
              src={images[lightbox]!}
              alt={`${title} — фото ${lightbox + 1}`}
              fill
              className="object-contain rounded-2xl"
              sizes="88vw"
              priority
            />
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-mono">
            {lightbox + 1} / {images.length}
          </div>
        </div>
      )}
    </section>
  );
}

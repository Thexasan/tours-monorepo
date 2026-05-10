"use client";

import Image from "next/image";
import { Star } from "lucide-react";
import { useLocale } from "next-intl";
import { type Review } from "@tours/types";
import { Card, CardContent } from "@/src/components/ui/card";

export function ReviewCard({ review }: { review: Review }) {
  const locale = useLocale() as "ru" | "en" | "tj";
  const tourTitle = review.tourTitle[locale] ?? review.tourTitle.ru;

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-100 shrink-0">
            {review.author.avatarUrl ? (
              <Image
                src={review.author.avatarUrl}
                alt={review.author.fullName}
                fill
                className="object-cover"
                sizes="40px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-200 text-zinc-600 font-medium">
                {review.author.fullName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold text-sm text-zinc-900">{review.author.fullName}</p>
            <p className="text-xs text-zinc-500">{tourTitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-amber-400 mb-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${i < review.rating ? "fill-current" : "text-zinc-300"}`}
            />
          ))}
        </div>

        <p className="text-sm text-zinc-700 line-clamp-3 flex-grow mb-4">{review.text}</p>

        {review.photos && review.photos.length > 0 && (
          <div className="flex gap-2 mt-auto">
            {review.photos.slice(0, 3).map((photo, i) => (
              <div key={i} className="relative w-16 h-16 rounded-md overflow-hidden shrink-0">
                <Image src={photo} alt="Review photo" fill className="object-cover" sizes="64px" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

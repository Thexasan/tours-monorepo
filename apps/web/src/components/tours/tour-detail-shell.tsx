"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { TourHero } from "./tour-hero";
import { BookingModal } from "@/src/components/bookings/booking-modal";
import type { RoomTypeOption } from "@tours/types";

interface Props {
  tourId: string;
  title: string;
  country: string;
  city: string | null;
  region?: string;
  coverImage: string;
  priceUsd: number;
  oldPriceUsd?: number;
  avgRating: number;
  reviewsCount: number;
  isHot: boolean;
  hotelStars: number;
  durationDays: number;
  roomTypes?: RoomTypeOption[];
  locale: string;
}

export function TourDetailHeroWithModal(props: Props) {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();
  const initialDate = searchParams?.get("date") ?? undefined;
  const initialGuests = (() => {
    const g = searchParams?.get("guests");
    return g ? Math.max(1, Math.min(20, parseInt(g, 10) || 1)) : 1;
  })();

  return (
    <>
      <TourHero {...props} onBook={() => setOpen(true)} />
      <BookingModal
        tourId={props.tourId}
        tourTitle={props.title}
        pricePerPerson={props.priceUsd}
        tourCoverImage={props.coverImage}
        tourCountry={props.country}
        tourHotelStars={props.hotelStars}
        tourDurationDays={props.durationDays}
        tourRoomTypes={props.roomTypes}
        initialDate={initialDate}
        initialGuests={initialGuests}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

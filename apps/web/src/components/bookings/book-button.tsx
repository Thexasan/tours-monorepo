"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { BookingModal } from "./booking-modal";

interface Props {
  tourId: string;
  tourTitle: string;
  pricePerPerson: number;
}

export function BookButton({ tourId, tourTitle, pricePerPerson }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
      >
        Оставить заявку
      </Button>
      <BookingModal
        tourId={tourId}
        tourTitle={tourTitle}
        pricePerPerson={pricePerPerson}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

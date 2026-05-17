import { Suspense } from "react";
import { ToursCatalog } from "@/src/components/tours/tours-catalog";

export default function ToursCatalogPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ToursCatalog />
    </Suspense>
  );
}

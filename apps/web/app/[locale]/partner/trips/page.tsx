import { Plane } from "lucide-react";
import { TripsList } from "@/src/components/dashboard/trips-list";
import { PageHeader } from "@/src/components/dashboard/page-header";

export default function PartnerTripsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Бронирования"
        title="Мои туры"
        description="Все ваши заявки на туры — статусы, документы, детали поездок."
        icon={<Plane className="h-5 w-5" />}
      />
      <TripsList basePath="partner" />
    </div>
  );
}

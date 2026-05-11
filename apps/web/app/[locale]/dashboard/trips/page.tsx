import { Plane } from "lucide-react";
import { TripsList } from "@/src/components/dashboard/trips-list";
import { PageHeader } from "@/src/components/dashboard/page-header";

export default function DashboardTripsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="История"
        title="Мои поездки"
        description="Все ваши заявки и состояния по бронированиям — в одном месте."
        icon={<Plane className="h-5 w-5" />}
      />
      <TripsList />
    </div>
  );
}

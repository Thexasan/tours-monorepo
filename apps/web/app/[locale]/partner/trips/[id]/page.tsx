import { Plane } from "lucide-react";
import { TouristBookingWorkspace } from "@/src/components/dashboard/booking/TouristBookingWorkspace";
import { PageHeader } from "@/src/components/dashboard/page-header";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export default async function PartnerTripDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <div>
      <PageHeader
        eyebrow="Заявки"
        title="Моя поездка"
        description="Детали заявки, статус документов и история изменений."
        icon={<Plane className="h-5 w-5" />}
      />
      <TouristBookingWorkspace bookingId={id} />
    </div>
  );
}
